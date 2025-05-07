// server/routes/profileRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

// Multer setup (same as before) …
const storage = multer.diskStorage({ /* … */ });
const upload = multer({ storage, limits: { fileSize: 5e6 }, fileFilter: (_r,f,cb)=>{/*…*/} });

/** 1) CREATE/upsert business profile */
router.post('/create-business-profile', requireAuth, async (req, res) => {
  const userId = req.user.id;
  if (!userId) return res.status(400).json({ error:'userId required' });
  try {
    const { data: u, error: ue } = await supabase
      .from('users').select('role,email').eq('id',userId).maybeSingle();
    if (ue) throw ue;
    if (!u || u.role!=='business') return res.status(400).json({ error:'Invalid business user' });

    const sessionId = uuidv4();
    const { data: profile, error: pe } = await supabase
      .from('business_profiles')
      .upsert({
        id: userId,
        session_id: sessionId,
        name:       'My Business',
        email:      u.email,
        values:     'Default values',
        product_type:'Default product',
        target_schools_sports:'All'
      }, { onConflict:'id' })
      .select().single();
    if (pe) throw pe;

    return res
      .status(profile.session_id===sessionId?201:200)
      .json({ success:true, profile });
  } catch(e:any){
    console.error(e);
    res.status(500).json({ error:e.message });
  }
});

/** 2) GET profile */
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const role   = (req.user.role||'').toLowerCase();
  try {
    let data, error;
    if (role==='athlete') {
      ({ data, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('id',userId)
        .single());
    } else if (role==='business') {
      ({ data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id',userId)
        .single());
    } else {
      ({ data, error } = await supabase
        .from('users')
        .select('id,email,role,created_at,last_login')
        .eq('id',userId)
        .maybeSingle());
    }
    if (error && error.code==='PGRST116') data = null, error = null;
    if (error) throw error;
    res.json(data||{ id:userId, role });
  } catch(e:any){
    console.error(e);
    res.status(500).json({ error:e.message });
  }
});

/** 3) PATCH profile */
router.patch('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const role   = (req.user.role||'').toLowerCase();
  const body   = { ...req.body, updated_at: new Date() };

  try {
    let record;
    if (role==='athlete') {
      ({ data:record, error:body.error } = await supabase
        .from('athlete_profiles')
        .upsert({ id:userId, ...body }, { onConflict:'id' })
        .select().single());
      if (body.error) throw body.error;
    } else if (role==='business') {
      ({ data:record, error:body.error } = await supabase
        .from('business_profiles')
        .upsert({ id:userId, ...body }, { onConflict:'id' })
        .select().single());
      if (body.error) throw body.error;
    } else {
      // general users: update only email
      const upd:any = {};
      if (body.email) upd.email = body.email;
      if (Object.keys(upd).length) {
        const { error:ue } = await supabase
          .from('users').update(upd).eq('id',userId);
        if (ue) throw ue;
      }
      ({ data:record, error:body.error } = await supabase
        .from('users')
        .select('id,email')
        .eq('id',userId)
        .single());
      if (body.error) throw body.error;
    }
    res.json({ message:'Profile updated successfully', profile:record });
  } catch(e:any){
    console.error(e);
    res.status(500).json({ error:e.message });
  }
});

/** 4) UPLOAD profile image */
router.post('/upload-image', requireAuth, upload.single('profile_image'), async (req,res) => {
  const userId = req.user.id;
  const role   = (req.user.role||'').toLowerCase();
  if (!req.file) return res.status(400).json({ error:'No image provided' });

  try {
    const key = `profile_images/${userId}/${req.file.filename}`;
    const buf = fs.readFileSync(req.file.path);
    const { error:upErr } = await supabase.storage.from('media')
      .upload(key,buf,{upsert:true});
    if (upErr) throw upErr;

    const { data:urlData } = supabase.storage.from('media')
      .getPublicUrl(key);
    const url = urlData.publicUrl;

    let tbl = role==='athlete' ? 'athlete_profiles'
            : role==='business'? 'business_profiles'
            : 'users';

    const colUpd:any = { profile_image:url, updated_at:new Date() };
    await supabase.from(tbl).update(colUpd).eq('id',userId);

    fs.unlinkSync(req.file.path);
    res.json({ message:'Image uploaded', imageUrl:url });
  } catch(e:any){
    console.error(e);
    if (req.file?.path&&fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error:e.message });
  }
});

/** 5) DELETE profile image */
router.delete('/remove-image', requireAuth, async (req,res) => {
  const userId = req.user.id;
  const role   = (req.user.role||'').toLowerCase();
  const tbl = role==='athlete'? 'athlete_profiles'
            : role==='business'? 'business_profiles'
            : 'users';

  try {
    const { data:profile } = await supabase.from(tbl)
      .select('profile_image').eq('id',userId).single();

    if (profile?.profile_image) {
      const parts = new URL(profile.profile_image).pathname.split('/');
      const path = parts.slice(2).join('/');
      await supabase.storage.from('media').remove([path]);
    }

    await supabase.from(tbl)
      .update({ profile_image:null,updated_at:new Date() })
      .eq('id',userId);

    res.json({ message:'Profile image removed' });
  } catch(e:any){
    console.error(e);
    res.status(500).json({ error:e.message });
  }
});

export default router;
