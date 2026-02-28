import type { Metadata } from "next";
import RegisterClient from "@/components/auth/RegisterClient";

export const metadata: Metadata = {
  title: "Criar conta — TuraTuno",
  description: "Crie sua conta TuraTuno. 7 dias grátis, sem cartão de crédito.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
