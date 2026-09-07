'use client'

import Link from 'next/link'
import { useState } from 'react'
import { IoLogoWhatsapp, IoMdFemale, IoMdMale } from 'react-icons/io'
import { FiCheck, FiEdit2, FiTrash2 } from 'react-icons/fi'
import Button from './Button'
import Popup from './Popup'
import type { Pet } from '@/types'

interface ItemProps {
  pet: Pet
  admin: boolean
  onDelete?: (id: Pet['id'], name: string) => void
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export default function Item({ pet, admin, onDelete }: ItemProps) {
  const { id, nome, descricao, especie, foto, porte, sexo, contato } = pet
  const [zoom, setZoom] = useState(false)

  const whatsappLink = contato
    ? `https://wa.me/55${digitsOnly(contato)}?text=${encodeURIComponent(`Quero saber mais sobre o ${especie} ${nome}`)}`
    : null

  const careDetails = [
    pet.vacinado ? 'Vacinado' : null,
    pet.vermifugado ? 'Vermifugado' : null,
    pet.castrado ? 'Castrado' : null,
    pet.microchip ? 'Microchipado' : null,
  ].filter(Boolean) as string[]

  return (
    <>
      <Popup
        open={zoom}
        setOpen={setZoom}
        title={`foto ${nome}`}
        content={
          // eslint-disable-next-line @next/next/no-img-element -- remote user-uploaded photo
          <img src={foto ?? undefined} alt={nome} className="h-[calc(100vh-100px)] w-full object-contain" />
        }
      />

      <article className="flex w-full flex-col overflow-hidden rounded-2xl border-2 border-(--primary-color) bg-(--bg-color2) shadow-sm transition-transform duration-200 hover:-translate-y-1 min-[500px]:w-60">
        <div className="bg-(--primary-color) px-3 py-2">
          <button type="button" onClick={() => setZoom(true)} className="mx-auto block cursor-zoom-in" aria-label={`Ampliar foto de ${nome}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote user-uploaded photo */}
            <img src={foto ?? undefined} alt={`um ${especie} ${sexo} ${porte}`} className="h-24 w-24 rounded-full border-6 border-(--bg-color2) bg-white object-cover" />
          </button>

          <div className="mt-1 flex items-center justify-center gap-1 text-base font-bold text-(--text-color)">
            <span>{nome}</span>
            {sexo === 'macho' ? <IoMdMale className="text-blue-600" aria-label="Macho" /> : <IoMdFemale className="text-pink-600" aria-label="Fêmea" />}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-2.5 text-(--text-color2)">
          <p className="text-center text-base font-bold">
            {especie === 'cachorro' && sexo === 'macho' && 'Cachorro de '}
            {especie === 'cachorro' && sexo === 'femea' && 'Cadela de '}
            {especie === 'gato' && sexo === 'femea' && 'Gata de '}
            {especie === 'gato' && sexo === 'macho' && 'Gato de '}
            {porte === 'medio' ? 'médio' : porte} porte
          </p>

          {admin ? (
            <div className="mt-auto flex gap-2">
              <Link href={`/gerenciar/${id}`} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-(--primary-color) px-2 py-2 text-sm font-bold text-(--text-color) hover:bg-(--tertiary-color)">
                <FiEdit2 aria-hidden="true" /> Editar
              </Link>
              <button type="button" onClick={() => onDelete?.(id, nome)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border-2 border-(--primary-color) px-2 py-2 text-sm font-bold text-(--text-color) hover:bg-white" aria-label={`Apagar ${nome}`}>
                <FiTrash2 aria-hidden="true" /> Apagar
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-sm">
                <p className="line-clamp-2 text-center text-[13px] leading-snug">{descricao}.</p>
                <div className="flex flex-wrap justify-center gap-1.5 text-sm font-bold text-(--text-color)">
                  <span className="rounded-full bg-white px-2 py-1">{especie === 'cachorro' ? 'Cachorro' : 'Gato'}</span>
                  <span className="rounded-full bg-white px-2 py-1">Porte {porte === 'medio' ? 'médio' : porte}</span>
                </div>
                {careDetails.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm font-medium text-(--text-color)">
                    {careDetails.map((detail) => (
                      <span key={detail} className="flex items-center gap-1">
                        <FiCheck aria-hidden="true" /> {detail}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-(--text-color2)">Saúde não informada</p>
                )}
                {pet.vermifugado && pet.dataVermifugacao && (
                  <p className="text-center text-xs text-(--text-color2)">
                    Vermifugado em {new Date(pet.dataVermifugacao).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-auto"><Button name={<span className="flex items-center justify-center gap-1"><IoLogoWhatsapp /> Tenho interesse</span>} /></a>}
            </>
          )}
        </div>
      </article>
    </>
  )
}
