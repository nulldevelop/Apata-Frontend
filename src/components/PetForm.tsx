'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FocusEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { PatternFormat } from 'react-number-format'
import type { z } from 'zod'
import Button from './Button'
import Spinner from './Spinner'
import { createPet } from '@/lib/api'
import { compressImage } from '@/lib/compressImage'
import { petFormSchema } from '@/lib/validation/pet'

type PetFormValues = z.input<typeof petFormSchema>

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
  foto: null,
} as unknown as PetFormValues

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
  } = useForm<PetFormValues>({
    mode: 'all',
    defaultValues: INITIAL_VALUES,
    resolver: zodResolver(petFormSchema),
  })

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

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <form
        onSubmit={(e) => void handleSubmit(submit)(e)}
        className="mx-auto flex w-full max-w-2xl flex-col rounded-2xl bg-(--bg-color2) px-5 py-6 shadow-sm sm:px-8"
      >
        <div className="mb-2 text-left">
          <p className="text-sm font-bold uppercase tracking-wide text-(--tertiary-color)">Novo cadastro</p>
          <h1 className="text-3xl font-bold text-(--text-color2)">Cadastre um animal</h1>
          <p className="mt-1 text-base text-(--text-color2)">Preencha os dados para ajudar esse animal a encontrar um lar.</p>
        </div>
        <fieldset disabled={status !== 'inicio'} className="flex flex-col">
          <label className="formlabel" htmlFor="nome">Nome do animal</label>
          <input id="nome" className="input" {...register('nome', { required: 'Campo obrigatório' })} type="text" placeholder="Ex.: Mel" onFocus={scrollIntoCenter} aria-invalid={Boolean(errors.nome)} />
          {errors.nome && <p className="formerro">{errors.nome.message}</p>}

          <label className="formlabel" htmlFor="foto">Foto do animal</label>

          <Button name={photoPreview ? 'Trocar imagem' : 'Escolher imagem'} onClick={() => photoInput.current?.click()} size={15} />

          <input id="foto" type="file" ref={photoInput} onChange={(event) => void handleFileChange(event)} onFocus={scrollIntoCenter} className="hidden" accept="image/*" />

          {photoPreview ? (
            <div className="mt-2 flex items-center gap-3 rounded-xl border-2 border-(--primary-color) bg-white p-2 text-left">
              <img src={photoPreview} alt="Prévia da foto selecionada" className="h-20 w-20 rounded-lg object-cover" />
              <p className="break-all text-base text-(--text-color)">{fileName}</p>
            </div>
          ) : (
            <p className="text-base text-(--text-color2)">JPG, PNG ou outro formato de imagem.</p>
          )}

          {errors.foto && <p className="formerro">{errors.foto.message}</p>}

          <label className="formlabel" htmlFor="especie">Espécie</label>
          <select id="especie" className="input" {...register('especie', { required: 'Campo obrigatório' })}>
            <option value="">Selecione</option>
            <option value="cachorro">Cachorro</option>
            <option value="gato">Gato</option>
          </select>
          {errors.especie && <p className="formerro">{errors.especie.message}</p>}

          <label className="formlabel" htmlFor="porte">Porte</label>
          <select id="porte" className="input" {...register('porte', { required: 'Campo obrigatório' })}>
            <option value="">Selecione</option>
            <option value="pequeno">Pequeno</option>
            <option value="medio">Médio</option>
            <option value="grande">Grande</option>
          </select>
          {errors.porte && <p className="formerro">{errors.porte.message}</p>}

          <label className="formlabel" htmlFor="sexo">Sexo</label>
          <select id="sexo" className="input" {...register('sexo', { required: 'Campo obrigatório' })}>
            <option value="">Selecione</option>
            <option value="macho">Macho</option>
            <option value="femea">Fêmea</option>
          </select>
          {errors.sexo && <p className="formerro">{errors.sexo.message}</p>}

          <label className="formlabel" htmlFor="descricao">Sobre o animal</label>
          <textarea
            id="descricao"
            className="textarea max-h-16"
            {...register('descricao', { required: 'Campo obrigatório' })}
            rows={2}
            placeholder="Idade, castrado, deficiência e etc."
            onFocus={scrollIntoCenter}
          />
          {errors.descricao && <p className="formerro">{errors.descricao.message}</p>}

          <label className="formlabel" htmlFor="contato">Contato</label>
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
                className="input"
                prefix="+55 "
                format="(##) # ####-####"
                placeholder="(XX) X XXXX-XXXX"
                onFocus={scrollIntoCenter}
                inputMode="numeric"
                onValueChange={(values) => onChange(values.value)}
              />
            )}
          />
        </fieldset>

        {errors.contato && <p className="formerro">{errors.contato.message}</p>}

        <br />
        <Button
          name={status === 'inicio' ? 'Salvar' : 'Salvando...'}
          type="submit"
          size={20}
          disabled={status !== 'inicio'}
          className={status === 'inicio' ? '' : 'cursor-default bg-gray-300 text-gray-600 hover:bg-gray-300 hover:text-gray-600'}
        />
      </form>

      {status === 'load' && <Spinner className="mx-auto m-4" />}

      {message === 'ok' && status !== 'load' && <p className="p-2 text-base text-green-600 font-bold"> Cadastro feito com sucesso!</p>}
      {message === 'erro' && status !== 'load' && <p className="pt-10 text-base text-[rgb(128,0,0)] font-bold"> Erro ao cadastrar!</p>}
    </div>
  )
}
