import { redirect } from 'next/navigation';

export default function HomePage() {
  // Amint valaki megnyitja a porta.u-szeged.hu-t, azonnal az admin loginra/panelre dobja
  redirect('/admin');
}