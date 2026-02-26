import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testarBanco() {
    const todosComentarios = await prisma.comments.findMany()
    console.log(todosComentarios)
}