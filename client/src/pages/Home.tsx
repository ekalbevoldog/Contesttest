
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatInterface from "@/components/ChatInterface";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto p-6 shadow-lg border-t-4 border-primary">
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
              Welcome to Contested
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Where mid-tier athletes and small-to-medium businesses create winning partnerships
          </p>
          <p className="text-muted-foreground mb-6">
            Our AI-powered matching platform connects the right athletes with the right brands, creating authentic partnerships that deliver real results.
          </p>
          <ChatInterface />
        </Card>
      </main>
      <Footer />
    </div>
  );
}
