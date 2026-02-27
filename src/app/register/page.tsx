import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white', fontFamily: 'sans-serif' }}>
                Carregando o TuraTuno...
            </div>
        }>
            <RegisterClient />
        </Suspense>
    );
}