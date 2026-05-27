import { X } from 'lucide-react'
import Button from './Button'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  confirmColor?: 'primary' | 'danger'
}

export default function Dialog({
  isOpen,
  onClose,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  confirmColor = 'primary',
}: DialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#3C2415]/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-[#E5DDD3]">
          <h3 className="font-['Playfair_Display'] text-xl text-[#3C2415]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#3C2415]/40 hover:text-[#3C2415] transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-[#3C2415]/70 leading-relaxed">{message}</p>
        </div>
        
        <div className="flex gap-3 p-6 border-t border-[#E5DDD3]">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmColor === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
