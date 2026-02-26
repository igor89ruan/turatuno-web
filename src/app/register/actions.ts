'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function registerUser(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Aqui você deve adicionar uma biblioteca como 'bcrypt' para criptografar a senha depois!

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password, // Salve criptografada no futuro
            },
        });
    } catch (error) {
        console.error("Erro ao cadastrar:", error);
        return { error: "Este email já está cadastrado." };
    }

    redirect('/login');
}