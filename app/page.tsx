'use client'

import { useState, useEffect, useRef } from 'react'
import Tile from './components/Tile'
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Plus, Download, Upload, Moon, Sun } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import AddTileForm from './components/AddTileForm'
import { Button } from '@/components/ui/button'

export interface TileData {
  id: string
  type?: 'link' | 'folder'
  url: string
  icon: string
  backgroundColor?: string
  position: number
  text?: string
  displayMode: 'icon' | 'text'
  folderName?: string
  folderTiles?: TileData[]
}

interface EmptySlotProps {
  index: number
  dark: boolean
  onDrop: (dragIndex: number, dropIndex: number) => void
  onClick: (index: number) => void
  moveFromFolderToMainGrid: (tileId: string, folderId: string) => void
}

type DragItem = { index: number; id: string; parentFolderId?: string }

const EmptySlot = ({ index, dark, onDrop, onClick, moveFromFolderToMainGrid }: EmptySlotProps) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'tile',
    drop: (item: DragItem) => {
      if (item.parentFolderId) {
        moveFromFolderToMainGrid(item.id, item.parentFolderId)
      } else {
        onDrop(item.index, index)
      }
      return {}
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
    }),
  })

  return (
    <div
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
      onClick={() => onClick(index)}
      className={`rounded-2xl aspect-square flex items-center justify-center group cursor-pointer transition-all duration-200 border
        ${dark
          ? isOver ? 'bg-white/10 border-white/25' : 'bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.09] hover:border-white/15'
          : isOver ? 'bg-black/8 border-black/20'  : 'bg-black/[0.03] border-black/[0.07] hover:bg-black/[0.06] hover:border-black/15'
        }`}
    >
      <Plus className={`h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${dark ? 'text-white/30' : 'text-black/25'}`} />
    </div>
  )
}

export default function Home() {
  const [tiles, setTiles] = useState<TileData[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [dark, setDark] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const gridSize = 36

  // Keep --launchpad-tile CSS variable in sync with the real tile size
  useEffect(() => {
    const update = () => {
      if (!gridRef.current) return
      const w = gridRef.current.offsetWidth
      const tileSize = Math.round((w - 5 * 16) / 6) // 6 cols, gap-4 = 16px
      document.documentElement.style.setProperty('--launchpad-tile', `${tileSize}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    if (gridRef.current) ro.observe(gridRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const storedTiles = localStorage.getItem('launchpadTiles')
    if (storedTiles) setTiles(JSON.parse(storedTiles))
    const storedDark = localStorage.getItem('launchpadDark')
    if (storedDark !== null) setDark(storedDark === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('launchpadTiles', JSON.stringify(tiles))
  }, [tiles])

  useEffect(() => {
    localStorage.setItem('launchpadDark', String(dark))
  }, [dark])

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

  const moveTileIntoFolder = (sourceTilePosition: number, folderId: string) => {
    setTiles(prevTiles => {
      const sourceIdx = prevTiles.findIndex(t => t.position === sourceTilePosition)
      const folderIdx = prevTiles.findIndex(t => t.id === folderId)
      if (sourceIdx === -1 || folderIdx === -1) return prevTiles

      const sourceTile = prevTiles[sourceIdx]
      const folder = prevTiles[folderIdx]

      // First free slot inside the folder
      const used = new Set((folder.folderTiles || []).map(t => t.position))
      let slot = 0
      while (used.has(slot)) slot++

      const updatedFolder: TileData = {
        ...folder,
        folderTiles: [...(folder.folderTiles || []), { ...sourceTile, position: slot }],
      }

      return prevTiles
        .filter((_, i) => i !== sourceIdx)
        .map(t => t.id === folderId ? updatedFolder : t)
    })
  }

  const moveFromFolderToMainGrid = (tileId: string, folderId: string) => {
    setTiles(prevTiles => {
      const folder = prevTiles.find(t => t.id === folderId)
      if (!folder) return prevTiles
      const tileInFolder = (folder.folderTiles || []).find(t => t.id === tileId)
      if (!tileInFolder) return prevTiles

      // First free position on main grid
      const usedPositions = new Set(prevTiles.map(t => t.position))
      let freePos = 0
      while (usedPositions.has(freePos)) freePos++

      const updatedFolder: TileData = {
        ...folder,
        folderTiles: (folder.folderTiles || []).filter(t => t.id !== tileId),
      }
      const tileForMain: TileData = { ...tileInFolder, position: freePos }

      return prevTiles
        .map(t => t.id === folderId ? updatedFolder : t)
        .concat(tileForMain)
    })
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(tiles, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `launchpad-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedTiles = JSON.parse(e.target?.result as string)
        if (Array.isArray(importedTiles)) {
          setTiles(importedTiles)
        } else {
          alert('Invalid JSON format')
        }
      } catch (error) {
        alert('Error reading JSON file')
      }
    }
    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
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
            moveTileIntoFolder={moveTileIntoFolder}
            moveFromFolderToMainGrid={moveFromFolderToMainGrid}
          />
        ) : (
          <EmptySlot
            index={index}
            dark={dark}
            onDrop={(dragIndex, dropIndex) => moveTile(dragIndex, dropIndex)}
            onClick={handleSlotClick}
            moveFromFolderToMainGrid={moveFromFolderToMainGrid}
          />
        )}
      </div>
    )
  })

  return (
    <DndProvider backend={HTML5Backend}>
      <main
        className="flex min-h-screen justify-center items-center transition-colors duration-300"
        style={{ backgroundColor: dark ? '#000000' : '#ffffff' }}
      >
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            onClick={() => setDark(d => !d)}
            variant="ghost"
            size="sm"
            className={dark
              ? 'text-white/50 hover:text-white/90 hover:bg-white/10 border border-white/10 hover:border-white/20'
              : 'text-black/40 hover:text-black/80 hover:bg-black/5 border border-black/10 hover:border-black/20'}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            onClick={handleExport}
            variant="ghost"
            size="sm"
            className={dark
              ? 'text-white/50 hover:text-white/90 hover:bg-white/10 border border-white/10 hover:border-white/20'
              : 'text-black/40 hover:text-black/80 hover:bg-black/5 border border-black/10 hover:border-black/20'}
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <Button
            onClick={handleImportClick}
            variant="ghost"
            size="sm"
            className={dark
              ? 'text-white/50 hover:text-white/90 hover:bg-white/10 border border-white/10 hover:border-white/20'
              : 'text-black/40 hover:text-black/80 hover:bg-black/5 border border-black/10 hover:border-black/20'}
          >
            <Upload className="h-4 w-4 mr-2" />
            Импорт
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        <div ref={gridRef} className="grid grid-cols-6 gap-4 max-w-5xl mx-auto w-3/5 h-3/5">
          {slots}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md w-full p-0 overflow-hidden">
            <DialogTitle className="sr-only">Add New Tile</DialogTitle>
            <AddTileForm addTile={handleAddTile} />
          </DialogContent>
        </Dialog>
      </main>
    </DndProvider>
  )
}

