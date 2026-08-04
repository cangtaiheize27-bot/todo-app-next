import "./globals.css";

export const metadata = {
  title: "ToDo",
  description: "シンプルで気持ちよく使える ToDo リスト",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
