import { useRouter } from 'next/router'
import PhotoChat from '../../components/PhotoChat'

export default function ChatRoom() {
  const router = useRouter()
  const { roomId } = router.query

  if (!roomId) return null
  return <PhotoChat />
}
