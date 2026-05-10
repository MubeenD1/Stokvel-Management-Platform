import { useParams, useSearchParams } from 'react-router-dom';
import MyContributions from './MyContributions';
import ContributionsSection from './ContributionsSection';

function Contributions() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const isTreasurerOrAdmin = role === 'TREASURER' || role === 'ADMIN';

  return isTreasurerOrAdmin
    ? <ContributionsSection groupId={id} members={[]} />
    : <MyContributions />;
}

export default Contributions;