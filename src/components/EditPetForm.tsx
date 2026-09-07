'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PatternFormat } from 'react-number-format'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { FiArrowLeft, FiSave, FiUpload, FiX } from 'react-icons/fi'
import Button from './Button'
import Spinner from './Spinner'
import { compressImage } from '@/lib/compressImage'
import { getPet, updatePet } from '@/lib/api'
import { petFieldsSchema } from '@/lib/validation/pet'

type EditInput = z.input<typeof petFieldsSchema>
type EditValues = z.output<typeof petFieldsSchema>

type LoadState = 'loading' | 'ready' | 'error' | 'saving'

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

export default function EditPetForm() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const photoInput = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [petName, setPetName] = useState('')
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<EditInput, unknown, EditValues>({ resolver: zodResolver(petFieldsSchema), mode: 'onChange' })

  const vermifugado = watch('vermifugado')
  const microchip = watch('microchip')

  useEffect(() => {
    let active = true

    async function loadPet() {
      try {
        const pet = await getPet(params.id)
        if (!active) return
        setPetName(pet.nome)
        setCurrentPhoto(pet.foto)
        reset({
          nome: pet.nome,
          especie: pet.especie,
          porte: pet.porte,
          sexo: pet.sexo,
          descricao: pet.descricao,
          contato: digitsOnly(pet.contato ?? ''),
          vacinado: pet.vacinado,
          vermifugado: pet.vermifugado,
          dataVermifugacao: pet.dataVermifugacao ? pet.dataVermifugacao.slice(0, 10) : '',
          castrado: pet.castrado,
          microchip: pet.microchip,
          numeroMicrochip: pet.numeroMicrochip ?? '',
        })
        setState('ready')
      } catch {
        if (active) setState('error')
      }
    }

    void loadPet()
    return () => {
      active = false
    }
  }, [params.id, reset])

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const compressedFile = await compressImage(file)
      if (photoPreview) URL.revokeObjectURL(photoPreview)
      setSelectedPhoto(compressedFile)
      setPhotoPreview(URL.createObjectURL(compressedFile))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível processar a imagem')
    }
  }

  function removePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setSelectedPhoto(null)
    setPhotoPreview('')
    if (photoInput.current) photoInput.current.value = ''
  }

  async function save(values: EditValues) {
    setState('saving')
    setErrorMessage('')

    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)))
    if (selectedPhoto) formData.append('file', selectedPhoto)

    try {
      await updatePet(params.id, formData)
      router.push('/gerenciar')
      router.refresh()
    } catch {
      setErrorMessage('Não foi possível salvar as alterações.')
      setState('ready')
    }
  }

  if (state === 'loading') return <Spinner className="m-16 mx-auto" />

  if (state === 'error') {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-12 text-(--text-color)">
        <h1 className="text-2xl font-bold">Animal não encontrado</h1>
        <Button name="Voltar para gerenciar" onClick={() => router.push('/gerenciar')} size={15} />
      </main>
    )
  }

  const displayedPhoto = photoPreview || currentPhoto

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <button type="button" onClick={() => router.push('/gerenciar')} className="mb-5 flex items-center gap-2 rounded-lg px-2 py-1 text-(--text-color) transition-colors hover:bg-(--bg-color2) hover:text-(--tertiary-color)">
        <FiArrowLeft aria-hidden="true" /> Voltar para gerenciar
      </button>

      <section className="overflow-hidden rounded-2xl border-2 border-(--primary-color) bg-(--bg-color2) shadow-sm">
        <header className="border-b-2 border-(--primary-color) px-5 py-6 text-left sm:px-8">
          <p className="text-sm font-bold uppercase tracking-wide text-(--tertiary-color)">Edição do cadastro</p>
          <div className="mt-1 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-(--text-color2)">Editar {petName}</h1>
              <p className="mt-1 text-base text-(--text-color2)">Atualize os dados e mantenha o cadastro completo.</p>
            </div>
            <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-bold text-(--text-color)">Cadastro ativo</span>
          </div>
        </header>

        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(190px,0.7fr)_minmax(0,1.3fr)]">
          <aside className="h-fit rounded-xl border-2 border-(--primary-color) bg-white p-4 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-(--text-color)">Foto do animal</p>
            <div className="mx-auto flex aspect-square w-full max-w-56 items-center justify-center overflow-hidden rounded-xl bg-(--primary-color)">
              {displayedPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview or remote user-uploaded photo
                <img src={displayedPhoto} alt={`Prévia de ${petName}`} className="h-full w-full object-cover" />
              ) : (
                <span className="text-(--text-color)">Sem foto</span>
              )}
            </div>
            <input id="foto-edicao" type="file" ref={photoInput} onChange={(event) => void handlePhotoChange(event)} className="hidden" accept="image/jpeg,image/png,.jpg,.jpeg,.png" />
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" onClick={() => photoInput.current?.click()} className="flex items-center justify-center gap-2 rounded-lg bg-(--primary-color) px-3 py-2 font-bold text-(--text-color) transition-colors hover:bg-(--tertiary-color)">
                <FiUpload aria-hidden="true" /> Trocar foto
              </button>
              {photoPreview && (
                <button type="button" onClick={removePhoto} className="flex items-center justify-center gap-2 rounded-lg border-2 border-(--primary-color) px-3 py-2 font-bold text-(--text-color) transition-colors hover:bg-(--bg-color2)">
                  <FiX aria-hidden="true" /> Desfazer foto nova
                </button>
              )}
            </div>
          </aside>

          <form onSubmit={(event) => void handleSubmit(save)(event)} className="flex flex-col gap-2">
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="sm:col-span-2">
                <label className="formlabel" htmlFor="nome">Nome do animal</label>
                <input id="nome" className="input" {...register('nome')} />
                {errors.nome && <p className="formerro">{errors.nome.message}</p>}
              </div>

              <div>
                <label className="formlabel" htmlFor="especie">Espécie</label>
                <select id="especie" className="input" {...register('especie')}>
                  <option value="">Selecione</option>
                  <option value="cachorro">Cachorro</option>
                  <option value="gato">Gato</option>
                </select>
                {errors.especie && <p className="formerro">{errors.especie.message}</p>}
              </div>

              <div>
                <label className="formlabel" htmlFor="porte">Porte</label>
                <select id="porte" className="input" {...register('porte')}>
                  <option value="">Selecione</option>
                  <option value="pequeno">Pequeno</option>
                  <option value="medio">Médio</option>
                  <option value="grande">Grande</option>
                </select>
                {errors.porte && <p className="formerro">{errors.porte.message}</p>}
              </div>

              <div>
                <label className="formlabel" htmlFor="sexo">Sexo</label>
                <select id="sexo" className="input" {...register('sexo')}>
                  <option value="">Selecione</option>
                  <option value="macho">Macho</option>
                  <option value="femea">Fêmea</option>
                </select>
                {errors.sexo && <p className="formerro">{errors.sexo.message}</p>}
              </div>

              <div>
                <label className="formlabel" htmlFor="contato">Contato</label>
                <Controller
                  name="contato"
                  control={control}
                  render={({ field: { ref, onChange, ...field } }) => (
                    <PatternFormat {...field} getInputRef={ref} id="contato" className="input" prefix="+55 " format="(##) # ####-####" placeholder="(XX) X XXXX-XXXX" inputMode="numeric" onValueChange={(values) => onChange(values.value)} />
                  )}
                />
                {errors.contato && <p className="formerro">{errors.contato.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="formlabel" htmlFor="descricao">Sobre o animal</label>
                <textarea id="descricao" className="textarea min-h-28" {...register('descricao')} rows={4} />
                {errors.descricao && <p className="formerro">{errors.descricao.message}</p>}
              </div>

              <fieldset className="sm:col-span-2 rounded-xl border-2 border-(--primary-color) bg-white p-3 text-left">
                <legend className="px-1 text-lg font-bold text-(--text-color)">Cuidados e identificação</legend>
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
                    <label className="formlabel" htmlFor="dataVermifugacao">Data da vermifugação</label>
                    <input id="dataVermifugacao" className="input" type="date" {...register('dataVermifugacao')} />
                    {errors.dataVermifugacao && <p className="formerro">{errors.dataVermifugacao.message}</p>}
                  </div>
                )}
                {microchip && (
                  <div className="mt-2">
                    <label className="formlabel" htmlFor="numeroMicrochip">Número do microchip</label>
                    <input id="numeroMicrochip" className="input" type="text" inputMode="numeric" placeholder="Digite o número" {...register('numeroMicrochip')} />
                    {errors.numeroMicrochip && <p className="formerro">{errors.numeroMicrochip.message}</p>}
                  </div>
                )}
              </fieldset>
            </div>

            {errorMessage && <p className="formerro">{errorMessage}</p>}
            <Button name={state === 'saving' ? 'Salvando...' : <span className="flex items-center justify-center gap-2"><FiSave aria-hidden="true" /> Salvar alterações</span>} type="submit" disabled={state === 'saving'} size={15} className="mt-4" />
          </form>
        </div>
      </section>
    </main>
  )
}
