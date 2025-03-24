import PreRegistrationWizard from "@/components/PreRegistrationWizard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RegistrationWizard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PreRegistrationWizard />
      </main>
      <Footer />
    </div>
  );
}