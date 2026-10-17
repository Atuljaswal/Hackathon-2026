import { useState } from 'react'
import Modal from '../../components/Modal'
import ProfileAvatar from './ProfileAvatar'

export default function ProfileSettings({ photo, onPhoto, onClose }) {
  const [error, setError] = useState('')
  function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Choose a JPG, PNG, or WebP image smaller than 2 MB.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onerror = () => setError('This photo could not be read. Try another image.')
    reader.onload = () => { onPhoto(reader.result); setError('') }
    reader.readAsDataURL(file)
  }
  return <Modal titleId="profile-title" onClose={onClose}>
    <span className="eyebrow">A FACE TO SAY HELLO TO</span>
    <h2 id="profile-title">Make it feel like you.</h2>
    <ProfileAvatar name="You" photoUrl={photo} large/>
    <p>Your photo will appear on your profile and match card when live matching is connected.</p>
    <label className="photo-label">Choose a profile photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/></label>
    <p className="hint">JPG, PNG or WebP · up to 2 MB. This demo saves your photo only in this browser.</p>
    {error && <p role="alert">{error}</p>}
    <div className="actions">{photo && <button className="secondary" onClick={() => onPhoto('')}>Remove photo</button>}<button className="primary" onClick={onClose}>Done</button></div>
  </Modal>
}
