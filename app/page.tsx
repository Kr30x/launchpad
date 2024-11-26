'use client'

import { useState, useEffect } from 'react'
import Tile from './components/Tile'
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import AddTileForm from './components/AddTileForm'

export interface TileData {
  id: string
  url: string
  icon: string
  backgroundColor?: string
  position: number
}

interface EmptySlotProps {
  index: number
  onDrop: (dragIndex: number, dropIndex: number) => void
  onClick: (index: number) => void
}

const EmptySlot = ({ index, onDrop, onClick }: EmptySlotProps) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'tile',
    drop: (item: { index: number }) => {
      onDrop(item.index, index)
      return undefined
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
    }),
  })

  return (
    <div
      ref={drop}
      onClick={() => onClick(index)}
      className={`bg-gray-50 rounded-lg shadow-sm aspect-square flex items-center justify-center group cursor-pointer
        hover:bg-gray-100 transition-colors duration-200
        ${isOver ? 'bg-gray-100' : ''}`}
    >
      <Plus className="h-6 w-6 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  )
}

export default function Home() {
  const [tiles, setTiles] = useState<TileData[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const gridSize = 36

  useEffect(() => {
    const storedTiles = localStorage.getItem('launchpadTiles')
    if (storedTiles) {
      setTiles(JSON.parse(storedTiles))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('launchpadTiles', JSON.stringify(tiles))
  }, [tiles])

  const handleAddTile = (newTile: Omit<TileData, 'id' | 'position'>) => {
    if (selectedPosition !== null) {
      setTiles([...tiles, { 
        ...newTile, 
        id: Date.now().toString(), 
        position: selectedPosition 
      }])
      setIsDialogOpen(false)
      setSelectedPosition(null)
    }
  }

  const handleSlotClick = (position: number) => {
    setSelectedPosition(position)
    setIsDialogOpen(true)
  }

  const moveTile = (dragIndex: number, hoverIndex: number) => {
    console.log('Moving tile from', dragIndex, 'to', hoverIndex)
    
    setTiles(prevTiles => {
      const newTiles = [...prevTiles]
      const dragTileIndex = newTiles.findIndex(t => t.position === dragIndex)
      const hoverTileIndex = newTiles.findIndex(t => t.position === hoverIndex)
      
      if (dragTileIndex !== -1) {
        if (hoverTileIndex !== -1) {
          // Swap positions
          const dragTile = { ...newTiles[dragTileIndex] }
          const hoverTile = { ...newTiles[hoverTileIndex] }
          
          // Create new objects with swapped positions
          newTiles[dragTileIndex] = {
            ...hoverTile,
            position: dragIndex
          }
          
          newTiles[hoverTileIndex] = {
            ...dragTile,
            position: hoverIndex
          }
          
          console.log('Swapped positions in array')
        } else {
          // Moving to empty slot
          newTiles[dragTileIndex] = {
            ...newTiles[dragTileIndex],
            position: hoverIndex
          }
          console.log('Moved to empty position in array')
        }
      }

      return newTiles
    })
  }

  const updateTile = (updatedTile: TileData) => {
    setTiles(tiles.map(tile => tile.id === updatedTile.id ? updatedTile : tile))
  }

  const deleteTile = (id: string) => {
    setTiles(tiles.filter(tile => tile.id !== id))
  }

  const slots = Array(gridSize).fill(null).map((_, index) => {
    // Safe access to tile with optional chaining
    const tile = tiles.find(t => t?.position === index)
    
    return (
      <div key={`slot-${index}`} className="w-full h-full">
        {tile ? (
          <Tile
            key={tile.id}
            index={index}
            tile={tile}
            moveTile={moveTile}
            updateTile={updateTile}
            deleteTile={deleteTile}
          />
        ) : (
          <EmptySlot 
            index={index} 
            onDrop={(dragIndex, dropIndex) => {
              moveTile(dragIndex, dropIndex)
            }}
            onClick={handleSlotClick}
          />
        )}
      </div>
    )
  })

  return (
    <DndProvider backend={HTML5Backend}>
      <main className="flex min-h-screen bg-gray-100 justify-center items-center">
        <div className="grid grid-cols-6 gap-4 max-w-5xl mx-auto w-3/5 h-3/5">
          {slots}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl w-full min-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Tile</DialogTitle>
            </DialogHeader>
            <AddTileForm addTile={handleAddTile} />
          </DialogContent>
        </Dialog>
      </main>
    </DndProvider>
  )
}

