import Toast from './Toast'
import { useToast } from '../contexts/ToastContext'

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={removeToast}
          onUndo={toast.onUndo}
          duration={toast.duration}
          position={toast.position}
        />
      ))}
    </div>
  )
}

export default ToastContainer
