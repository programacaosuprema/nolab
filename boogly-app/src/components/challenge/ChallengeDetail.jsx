// src/pages/ChallengeDetail.jsx
import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../theme/useTheme';
import { useError } from '../../error/hooks/useError';
import { useAuth } from '../../autenticator/useAuth';
import { ChallengeStart } from './ChallengeStart';
import { AppContext } from '../../app_configuration/AppContext';
import { LoadingPage } from '../pages/LoadingPage';
import { getChallenge } from '../../services/challengeService';
import { normalizeError } from '../../error/utils/normalizeError';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { domainUrl, mainRoute } = useContext(AppContext); // ajuste conforme seu hook
  const { theme } = useTheme();
  const { showError } = useError();
  const { token } = useAuth() || {};

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation(); // para preservar query

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getChallenge({ domainUrl, id });
        setChallenge(data);
      } catch (err) {
        showError(normalizeError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [domainUrl, id, token, showError]);

  if (loading) return <LoadingPage />;
  if (!challenge) return <div>Desafio não encontrado</div>;

  return (
    <div style={{ padding: theme.spacing.lg }}>
      <ChallengeStart
        challenge={challenge}
        onStart={() => {
          // navega para a rota /play mantendo querystring (structure etc)
          navigate(`${mainRoute}/challenges/${id}/play${location.search}`, {
            replace: false,
          });
          // use replace:true se quiser evitar empilhar histórico
        }}
      />
    </div>
  );
}
