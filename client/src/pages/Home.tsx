import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ChatInterface />
        </div>
      </main>
      <Footer />
    </div>
  );
}
