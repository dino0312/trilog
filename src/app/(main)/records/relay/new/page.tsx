import { permanentRedirect } from 'next/navigation'

export default function NewRelayResultPage() {
  permanentRedirect('/records/new?tab=relay')
}
