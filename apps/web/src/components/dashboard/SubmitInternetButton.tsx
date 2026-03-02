import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@modern-router-management/ui'
import { submitInternet } from '../../lib/api'

interface SubmitInternetButtonProps {
  routerId: number
}

export function SubmitInternetButton({ routerId }: SubmitInternetButtonProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => submitInternet(routerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['router', routerId, 'status'] })
    },
  })

  return (
    <Button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="px-8 py-4 text-base"
    >
      {mutation.isPending ? 'Submitting...' : 'Submit Internet Settings'}
    </Button>
  )
}
