'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Settings, Copy, Download, Check } from 'lucide-react'
import { useWorkouts } from '@/hooks/use-workouts'

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const { deviceId, updateDeviceId, exportData } = useWorkouts()
  const [inputCode, setInputCode] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (deviceId) {
      navigator.clipboard.writeText(deviceId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLinkDevice = () => {
    if (inputCode.trim()) {
      updateDeviceId(inputCode)
      setInputCode('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-muted-foreground hover:bg-muted">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustes y Respaldo</DialogTitle>
          <DialogDescription>Sincroniza y respalda tus datos.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tu Código de Recuperación</label>
            <p className="text-xs text-muted-foreground mb-2">
              Guarda este código para recuperar tus rutinas si cambias de celular o navegador.
            </p>
            <div className="flex gap-2">
              <Input value={deviceId || ''} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vincular Dispositivo Existente</label>
            <p className="text-xs text-muted-foreground mb-2">
              Pega un código guardado previamente para restaurar tu cuenta.
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder="Ej: device-123..." 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="font-mono text-xs"
              />
              <Button onClick={handleLinkDevice} disabled={!inputCode.trim()}>
                Vincular
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <label className="text-sm font-medium">Respaldo Manual</label>
            <p className="text-xs text-muted-foreground mb-2">
              Descarga un archivo JSON con todos tus entrenamientos, fecha y pesos.
            </p>
            <Button variant="outline" className="w-full" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Exportar a JSON
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
