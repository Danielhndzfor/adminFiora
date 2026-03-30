'use client'

import * as React from 'react'
import { toast } from 'sonner'

export function useToast() {
  return {
    toast,
    dismiss: (id?: string) => toast.dismiss(id),
    promise: (p: Promise<any>, msgs: any) => toast.promise(p, msgs),
  }
}

export { toast }
