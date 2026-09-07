import { z } from 'zod'

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const petFieldsObject = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do animal'),
  especie: z.enum(['cachorro', 'gato'], { message: 'Selecione uma espécie' }),
  porte: z.enum(['pequeno', 'medio', 'grande'], { message: 'Selecione o porte' }),
  sexo: z.enum(['macho', 'femea'], { message: 'Selecione o sexo' }),
  descricao: z.string().trim().min(1, 'Informe uma descrição'),
  contato: z.string().regex(/^\d{11}$/, 'O número precisa ter 11 dígitos'),
  vacinado: z.boolean().default(false),
  vermifugado: z.boolean().default(false),
  dataVermifugacao: z.string().optional(),
  castrado: z.boolean().default(false),
  microchip: z.boolean().default(false),
  numeroMicrochip: z.string().trim().optional(),
})

function withPetRules<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
  return schema.superRefine((values, context) => {
    if (values.vermifugado && !values.dataVermifugacao) {
      context.addIssue({ code: 'custom', path: ['dataVermifugacao'], message: 'Informe a data da vermifugação' })
    }

    if (values.microchip && !values.numeroMicrochip) {
      context.addIssue({ code: 'custom', path: ['numeroMicrochip'], message: 'Informe o número do microchip' })
    }
  })
}

export const petFieldsSchema = withPetRules(petFieldsObject)

export const petImageSchema = z.custom<File>(
  (value) => typeof File !== 'undefined' && value instanceof File,
  'Selecione uma imagem',
).superRefine((file, context) => {
  const allowedTypes = ['image/jpeg', 'image/png']
  const allowedExtensions = ['.jpeg', '.jpg', '.png']
  const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()

  if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
    context.addIssue({ code: 'custom', message: 'A imagem precisa estar no formato JPEG, JPG ou PNG' })
  }
  if (file.size > MAX_IMAGE_SIZE) {
    context.addIssue({ code: 'custom', message: 'A imagem deve ter no máximo 5 MB' })
  }
})

export const petFormSchema = withPetRules(petFieldsObject.extend({
  foto: petImageSchema.nullable().refine((file) => file !== null, 'Selecione uma imagem'),
}))

export const petUpdateSchema = withPetRules(petFieldsObject.partial())
