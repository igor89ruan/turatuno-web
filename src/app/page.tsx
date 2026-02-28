import LandingPage from "@/components/landing/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TuraTuno — Pare de perder dinheiro sem saber pra onde vai",
  description:
    "Controle contas, cartões e metas em um só lugar. 7 dias grátis, sem cartão de crédito. Feito para o brasileiro.",
  openGraph: {
    title: "TuraTuno — Controle financeiro de verdade",
    description: "Você sabe que ganha bem, mas no fim do mês sobra pouco. O TuraTuno te mostra exatamente onde o dinheiro vai.",
    type: "website",
  },
};

export default function HomePage() {
  return <LandingPage />;
}
