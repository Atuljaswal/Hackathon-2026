import { useState } from 'react'
export default function ProfileAvatar({ name, photoUrl, large = false }) {
  const [failedUrl, setFailedUrl] = useState(null)
  return <span className={`avatar ${large ? 'profile-large' : ''}`}>
    {photoUrl && failedUrl !== photoUrl ? <img src={photoUrl} alt={`${name}'s profile`} onError={() => setFailedUrl(photoUrl)}/> : <span aria-label={name}>{name.split(' ').map(word => word[0]).slice(0, 2).join('')}</span>}
  </span>
}
