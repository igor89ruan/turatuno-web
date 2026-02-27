import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export const metadata = {
    title: "TuraTuno - Criar Conta",
    description: "Comece a controlar suas finanças hoje com o TuraTuno Finance OS.",
};

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#09090b', color: 'white', fontFamily: 'sans-serif' }}>
                Carregando formulário...
            </div>
        }>
            <RegisterClient />
        </Suspense>
    );
}
