import type { Metadata } from "next";
import LoginClient from "@/components/auth/LoginClient";

export const metadata: Metadata = {
  title: "Entrar — TuraTuno",
  description: "Entre na sua conta TuraTuno e retome o controle das suas finanças.",
};

export default function LoginPage() {
  return <LoginClient />;
}
