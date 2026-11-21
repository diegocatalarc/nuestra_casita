// Quién puede hablar en una escena: los vecinos del reparto (CAST) más voces que no caminan por el pueblo.
import { castById } from './characters';
import { t } from '../../i18n';

export const speakerById = {
  ...castById,
  funcionario: { id: 'funcionario', name: t("El Funcionario"), emoji: '🗂️', role: t("Negociado de Estaciones") },
  valle: { id: 'valle', name: t("El Valle"), emoji: '🌦️', role: t("en funciones de ustedes") },
};
