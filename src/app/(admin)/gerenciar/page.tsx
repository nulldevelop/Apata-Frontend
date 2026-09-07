'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Alert from '@/components/Alert'
import Button from '@/components/Button'
import Item from '@/components/Item'
import PetFilters from '@/components/PetFilters'
import Spinner from '@/components/Spinner'
import { deletePet, listPets } from '@/lib/api'
import { EMPTY_FILTERS, filterPets } from '@/lib/filterPets'
import type { Pet, PetFilters as PetFiltersValue } from '@/types'

interface DeleteTarget {
  id: Pet['id']
  name: string
}

export default function GerenciarPage() {
  const queryClient = useQueryClient()

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [filters, setFilters] = useState<PetFiltersValue>(EMPTY_FILTERS)

  const { data } = useQuery({ queryKey: ['itens'], queryFn: listPets })

  const deleteMutation = useMutation({
    mutationFn: (id: Pet['id']) => deletePet(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['itens'] }),
  })

  function requestDelete(id: Pet['id'], name: string) {
    setDeleteTarget({ id, name: name.length > 35 ? `${name.slice(0, 35)}...` : name })
    setDeleteAlertOpen(true)
  }

  function confirmDelete() {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
    setDeleteAlertOpen(false)
  }

  const filteredPets = filterPets(Array.isArray(data) ? data : [], filters)

  return (
    <div className="flex flex-col justify-start items-center">
      <a
        href="https://docs.google.com/spreadsheets/d/1mVn88CCj545VMwyB_zKJeR9mQrwkwHTB9OgM_MO7cm8/edit?usp=sharing"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button name={<p className="flex whitespace-nowrap items-center justify-center gap-1"> Contato de Doadores</p>} size={15} />
      </a>

      {data === undefined ? (
        <Spinner className="m-16 mx-auto" />
      ) : (
        <>
          <Alert
            title="AVISO"
            description={`Tem certeza que deseja excluir o "${deleteTarget?.name ?? ''}"?`}
            confirmLabel="Sim"
            onConfirm={confirmDelete}
            cancelLabel="Não"
            onCancel={() => setDeleteAlertOpen(false)}
            open={deleteAlertOpen}
          />

          <section className="mx-4 my-5 w-full max-w-5xl rounded-2xl border-2 border-(--primary-color) bg-(--bg-color2) p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-(--tertiary-color)">Painel de animais</p>
                <h2 className="text-xl font-bold text-(--text-color)">Encontre e gerencie os cadastros</h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-(--text-color)">{filteredPets.length} encontrados</span>
            </div>
            <div className="flex flex-col gap-2">
              <PetFilters filters={filters} onChange={setFilters} />
            </div>
          </section>

          <div className="grid w-full max-w-5xl grid-cols-1 gap-4 px-4 pb-6 min-[500px]:grid-cols-2 lg:grid-cols-3">
            {filteredPets.map((pet) => (
              <Item
                key={pet.id}
                pet={pet}
                admin={true}
                onDelete={requestDelete}
              />
            ))}

            {filteredPets.length <= 0 && <p className="text-[18pt] text-(--text-color)">Nenhum animal encontrado.</p>}
          </div>
        </>
      )}
    </div>
  )
}
