
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatInterface from "@/components/ChatInterface";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto p-6 shadow-lg">
          <h1 className="text-2xl font-semibold mb-4">Welcome to NIL Connect</h1>
          <p className="text-muted-foreground mb-6">
            Are you a college athlete looking for partnerships or a business looking to connect with athletes?
          </p>
          <ChatInterface />
        </Card>
      </main>
      <Footer />
    </div>
  );
}
