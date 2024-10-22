// components/PhotoChat.tsx
import { useEffect } from 'react'
import { supabase } from '../utils/supabase'

// ... existing imports

export default function PhotoChat() {
  // ... existing state

  // Subscribe to new messages
  useEffect(() => {
    if (roomId) {
      const channel = supabase
        .channel(`room:${roomId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        }, payload => {
          setMessages(prev => [...prev, payload.new])
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [roomId])

  // Modified image upload to use Supabase Storage
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB')
        return
      }

      try {
        const newRoomId = Date.now().toString(36)
        
        // Upload image to Supabase Storage
        const { data: imageData, error: uploadError } = await supabase
          .storage
          .from('room-images')
          .upload(`${newRoomId}`, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('room-images')
          .getPublicUrl(`${newRoomId}`)

        // Create room
        const { error: roomError } = await supabase
          .from('rooms')
          .insert({
            id: newRoomId,
            image_url: publicUrl,
            expires_at: new Date(Date.now() + EXPIRATION_TIME).toISOString()
          })

        if (roomError) throw roomError

        setImage(publicUrl)
        setRoomId(newRoomId)
        setIsPreview(true)
        window.history.pushState({ roomId: newRoomId }, '', `/chat/${newRoomId}`)
      } catch (error) {
        console.error('Upload error:', error)
        alert('Error uploading image')
      }
    }
  }

  // Modified message sending to use Supabase
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newMessage.trim() && !isExpired && roomId) {
      try {
        const { error } = await supabase
          .from('messages')
          .insert({
            room_id: roomId,
            user_name: userName,
            text: newMessage.trim()
          })

        if (error) throw error
        setNewMessage('')
        inputRef.current?.focus()
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }
  }

  // ... rest of your component
}
