import Navbar from "@/components/public-website/Navbar";
import Footer from "@/components/public-website/Footer";

export const metadata = {
  title: "Blog | Bhavo"
}

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="blog-main">
        <h1 className="blog-title">Blog</h1>
        <p className="blog-desc">
          Latest news, updates, and thoughts from the Bhavo team.
        </p>
      </main>
      <Footer />

      <style>{`
        .blog-main {
          padding-top: 120px;
          padding-bottom: 80px;
          min-height: calc(100vh - 200px);
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
        }
        .blog-title {
          font-size: 48px;
          font-weight: 900;
          margin-bottom: 24px;
          color: #0f172a;
          letter-spacing: -1px;
        }
        .blog-desc {
          font-size: 18px;
          color: #475569;
          max-width: 800px;
          line-height: 1.6;
        }
        @media (max-width: 768px) {
          .blog-main {
            padding-top: 84px;
            padding-bottom: 48px;
            padding-left: 16px;
            padding-right: 16px;
          }
          .blog-title {
            font-size: 32px;
            margin-bottom: 14px;
          }
          .blog-desc {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}
