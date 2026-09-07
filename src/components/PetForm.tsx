'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FocusEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import { FiEdit2, FiX } from 'react-icons/fi'
import type { z } from 'zod'
import Button from './Button'
import Spinner from './Spinner'
import { createPet } from '@/lib/api'
import { compressImage } from '@/lib/compressImage'
import { petFormSchema } from '@/lib/validation/pet'

type PetFormInput = z.input<typeof petFormSchema>
type PetFormValues = z.output<typeof petFormSchema>

const DEFAULT_PHONE = '93991185009'

type SubmitStatus = 'inicio' | 'load'
type SubmitMessage = '' | 'ok' | 'erro'

const INITIAL_VALUES = {
  nome: '',
  especie: '',
  porte: '',
  sexo: '',
  descricao: '',
  contato: DEFAULT_PHONE,
  vacinado: false,
  vermifugado: false,
  dataVermifugacao: '',
  castrado: false,
  microchip: false,
  numeroMicrochip: '',
  foto: null,
} as unknown as PetFormInput

function scrollIntoCenter(e: FocusEvent<HTMLElement>) {
  const target = e.target
  setTimeout(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 300)
}

export default function PetForm() {
  const photoInput = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [message, setMessage] = useState<SubmitMessage>('')
  const [status, setStatus] = useState<SubmitStatus>('inicio')

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    setError,
    watch,
  } = useForm<PetFormInput, unknown, PetFormValues>({
    mode: 'all',
    defaultValues: INITIAL_VALUES,
    resolver: zodResolver(petFormSchema),
  })

  const vermifugado = watch('vermifugado')
  const microchip = watch('microchip')

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  async function submit(values: PetFormValues) {
    if (status !== 'inicio') return

    setStatus('load')

    const formData = new FormData()
    formData.append('nome', values.nome)
    formData.append('especie', values.especie)
    formData.append('porte', values.porte)
    formData.append('sexo', values.sexo)
    formData.append('descricao', values.descricao)
    if (values.foto) formData.append('file', values.foto)
    formData.append('contato', values.contato)
    formData.append('vacinado', String(values.vacinado))
    formData.append('vermifugado', String(values.vermifugado))
    formData.append('dataVermifugacao', values.dataVermifugacao ?? '')
    formData.append('castrado', String(values.castrado))
    formData.append('microchip', String(values.microchip))
    formData.append('numeroMicrochip', values.numeroMicrochip ?? '')

    try {
      await createPet(formData)
      reset(INITIAL_VALUES)
      if (photoInput.current) photoInput.current.value = ''
      setFileName('')
      setPhotoPreview('')
      setStatus('inicio')
      setMessage('ok')
    } catch (error) {
      console.error(error)
      setStatus('inicio')
      setMessage('erro')
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoPreview) URL.revokeObjectURL(photoPreview)

    try {
      const compressedFile = await compressImage(file)
      setValue('foto', compressedFile, { shouldValidate: true, shouldDirty: true })
      setFileName(file.name)
      setPhotoPreview(URL.createObjectURL(compressedFile))
    } catch (error) {
      setValue('foto', null, { shouldValidate: true })
      setFileName('')
      setPhotoPreview('')
      setError('foto', { type: 'validate', message: error instanceof Error ? error.message : 'Não foi possível processar a imagem' })
    }
  }

  function removePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setValue('foto', null, { shouldValidate: true, shouldDirty: true })
    setFileName('')
    setPhotoPreview('')
    if (photoInput.current) photoInput.current.value = ''
  }

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <form
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border-2 border-(--primary-color) bg-(--bg-color2) shadow-sm"
      >
        <div className="border-b-2 border-(--primary-color) px-5 py-6 text-left sm:px-8">
          <p className="text-sm font-bold uppercase tracking-wide text-(--tertiary-color)">Novo cadastro</p>
          <div className="mt-1 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-(--text-color2)">Cadastre um animal</h1>
              <p className="mt-1 text-base text-(--text-color2)">Preencha os dados para ajudar esse animal a encontrar um lar.</p>
            </div>
            <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-bold text-(--text-color)">Novo cadastro</span>
          </div>
        </div>
        <fieldset disabled={status !== 'inicio'} className="flex flex-col gap-1 p-5 sm:p-8">
          <label className="formlabel !pb-1 !pt-3 !text-[17px]" htmlFor="nome">Nome do animal</label>
          <input id="nome" className="input !w-full !rounded-lg !text-base" {...register('nome', { required: 'Campo obrigatório' })} type="text" placeholder="Ex.: Mel" onFocus={scrollIntoCenter} aria-invalid={Boolean(errors.nome)} />
          {errors.nome && <p className="formerro">{errors.nome.message}</p>}

          <div className="mt-2 rounded-xl border-2 border-(--primary-color) bg-white p-4">
            <label className="formlabel mt-0 block !pb-1 !pt-0 !text-[17px]" htmlFor="foto">Foto do animal</label>

            <Button name={photoPreview ? 'Trocar imagem' : 'Escolher imagem'} onClick={() => photoInput.current?.click()} size={15} />

            <input id="foto" type="file" ref={photoInput} onChange={(event) => void handleFileChange(event)} onFocus={scrollIntoCenter} className="hidden" accept="image/jpeg,image/png,.jpg,.jpeg,.png" />

            {photoPreview ? (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-(--primary-color) bg-(--bg-color2) p-2 text-left">
              <div className="shrink-0">
                <img src={photoPreview} alt="Prévia da foto selecionada" className="h-20 w-20 rounded-lg object-cover" />
              </div>
              <p className="min-w-0 flex-1 break-all text-base text-(--text-color)">{fileName}</p>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => photoInput.current?.click()}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-(--tertiary-color) text-(--text-color2) shadow-sm transition-colors hover:bg-(--primary-color)"
                  aria-label="Editar foto selecionada"
                  title="Editar foto"
                >
                  <FiEdit2 aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#8f0404] text-lg font-bold text-white shadow-sm transition-colors hover:bg-[#b20a0a]"
                  aria-label="Remover foto selecionada"
                  title="Remover foto"
                >
                  <FiX aria-hidden="true" />
                </button>
              </div>
              </div>
            ) : (
              <p className="text-base text-(--text-color2)">JPG, PNG ou outro formato de imagem.</p>
            )}

            {errors.foto && <p className="formerro">{errors.foto.message}</p>}
          </div>

          <label className="formlabel !pb-1 !pt-4 !text-[17px]" htmlFor="especie">Espécie</label>
          <select id="especie" className="input !w-full !rounded-lg !text-base" {...register('especie', { required: 'Campo obrigatório' })}>
            <option value="">Selecione</option>
            <option value="cachorro">Cachorro</option>
            <option value="gato">Gato</option>
          </select>
          {errors.especie && <p className="formerro">{errors.especie.message}</p>}

          <label className="formlabel !pb-1 !pt-4 !text-[17px]" htmlFor="porte">Porte</label>
          <select id="porte" className="input !w-full !rounded-lg !text-base" {...register('porte', { required: 'Campo obrigatório' })}>
            <option value="">Selecione</option>
            <option value="pequeno">Pequeno</option>
            <option value="medio">Médio</option>
            <option value="grande">Grande</option>
          </select>
          {errors.porte && <p className="formerro">{errors.porte.message}</p>}

          <label className="formlabel !pb-1 !pt-4 !text-[17px]" htmlFor="sexo">Sexo</label>
          <select id="sexo" className="input !w-full !rounded-lg !text-base" {...register('sexo', { required: 'Campo obrigatório' })}>
            <option value="">Selecione</option>
            <option value="macho">Macho</option>
            <option value="femea">Fêmea</option>
          </select>
          {errors.sexo && <p className="formerro">{errors.sexo.message}</p>}

          <label className="formlabel !pb-1 !pt-4 !text-[17px]" htmlFor="descricao">Sobre o animal</label>
          <textarea
            id="descricao"
            className="textarea !w-full !rounded-lg !text-base"
            {...register('descricao', { required: 'Campo obrigatório' })}
            rows={2}
            placeholder="Idade, castrado, deficiência e etc."
            onFocus={scrollIntoCenter}
          />
          {errors.descricao && <p className="formerro">{errors.descricao.message}</p>}

          <label className="formlabel !pb-1 !pt-4 !text-[17px]" htmlFor="contato">Contato</label>
          <Controller
            name="contato"
            control={control}
            rules={{
              required: 'Campo obrigatório',
              validate: (value) => value.replace(/\D/g, '').length === 11 || 'O número precisa ter 11 dígitos',
            }}
            render={({ field: { ref, onChange, ...field } }) => (
              <PatternFormat
                {...field}
                getInputRef={ref}
                id="contato"
                className="input !w-full !rounded-lg !text-base"
                prefix="+55 "
                format="(##) # ####-####"
                placeholder="(XX) X XXXX-XXXX"
                onFocus={scrollIntoCenter}
                inputMode="numeric"
                onValueChange={(values) => onChange(values.value)}
              />
            )}
          />

          <fieldset className="mt-5 rounded-xl border-2 border-(--primary-color) bg-white p-4 text-left">
            <legend className="px-1 text-base font-bold text-(--text-color)">Cuidados e identificação</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2 text-base text-(--text-color2)">
                <input type="checkbox" {...register('vacinado')} /> Vacinado
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-base text-(--text-color2)">
                <input type="checkbox" {...register('castrado')} /> Castrado
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-base text-(--text-color2)">
                <input type="checkbox" {...register('vermifugado')} /> Vermifugado
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-base text-(--text-color2)">
                <input type="checkbox" {...register('microchip')} /> Possui microchip
              </label>
            </div>
            {vermifugado && (
              <div className="mt-2">
                <label className="formlabel !pb-1 !pt-2 !text-[17px]" htmlFor="dataVermifugacao">Data da vermifugação</label>
                <input id="dataVermifugacao" className="input !w-full !rounded-lg !text-base" type="date" {...register('dataVermifugacao')} />
                {errors.dataVermifugacao && <p className="formerro">{errors.dataVermifugacao.message}</p>}
              </div>
            )}
            {microchip && (
              <div className="mt-2">
                <label className="formlabel !pb-1 !pt-2 !text-[17px]" htmlFor="numeroMicrochip">Número do microchip</label>
                <input id="numeroMicrochip" className="input !w-full !rounded-lg !text-base" type="text" inputMode="numeric" placeholder="Digite o número" {...register('numeroMicrochip')} />
                {errors.numeroMicrochip && <p className="formerro">{errors.numeroMicrochip.message}</p>}
              </div>
            )}
          </fieldset>
        </fieldset>

        {errors.contato && <p className="formerro">{errors.contato.message}</p>}

        <div className="border-t-2 border-(--primary-color) px-5 py-4 sm:px-8">
          <Button
            name={status === 'inicio' ? 'Salvar cadastro' : 'Salvando...'}
            type="submit"
            size={20}
            disabled={status !== 'inicio'}
            className={status === 'inicio' ? '' : 'cursor-default bg-gray-300 text-gray-600 hover:bg-gray-300 hover:text-gray-600'}
          />
        </div>
      </form>

      {status === 'load' && <Spinner className="mx-auto m-4" />}

      {message === 'ok' && status !== 'load' && <p className="p-2 text-base text-green-600 font-bold"> Cadastro feito com sucesso!</p>}
      {message === 'erro' && status !== 'load' && <p className="pt-10 text-base text-[rgb(128,0,0)] font-bold"> Erro ao cadastrar!</p>}
    </div>
  )
}
