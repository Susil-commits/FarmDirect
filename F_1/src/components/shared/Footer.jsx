import GiantBrandFooter from '../common/GiantBrandFooter';
import { useRouter } from '../../hooks/useRouter';

export default function Footer() {
  const { navigate } = useRouter();
  return <GiantBrandFooter onNavigate={navigate} />;
}
