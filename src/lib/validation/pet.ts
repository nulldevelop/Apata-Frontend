import { z } from 'zod'

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export const petFieldsSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do animal'),
  especie: z.enum(['cachorro', 'gato'], { message: 'Selecione uma espécie' }),
  porte: z.enum(['pequeno', 'medio', 'grande'], { message: 'Selecione o porte' }),
  sexo: z.enum(['macho', 'femea'], { message: 'Selecione o sexo' }),
  descricao: z.string().trim().min(1, 'Informe uma descrição'),
  contato: z.string().regex(/^\d{11}$/, 'O número precisa ter 11 dígitos'),
})

export const petImageSchema = z.custom<File>(
  (value) => typeof File !== 'undefined' && value instanceof File,
  'Selecione uma imagem',
).superRefine((file, context) => {
  if (!file.type.startsWith('image/')) {
    context.addIssue({ code: 'custom', message: 'O arquivo precisa ser uma imagem' })
  }
  if (file.size > MAX_IMAGE_SIZE) {
    context.addIssue({ code: 'custom', message: 'A imagem deve ter no máximo 5 MB' })
  }
})

export const petFormSchema = petFieldsSchema.extend({
  foto: petImageSchema.nullable().refine((file) => file !== null, 'Selecione uma imagem'),
})

export const petUpdateSchema = petFieldsSchema.partial()
