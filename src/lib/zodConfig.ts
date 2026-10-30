import { z } from 'zod'

// Sin compilación de validaciones (jitless): zod probaría `new Function` para validar más rápido, y la
// Content-Security-Policy (netlify.toml) no permite eval. Sin esto, cada página con formulario deja un
// aviso de la política en la consola. Se importa primero en main.tsx, antes de cualquier esquema.
z.config({ jitless: true })
