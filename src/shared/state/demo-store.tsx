import { createContext, useContext, useState, type PropsWithChildren } from 'react';

import { parseDurationToMinutes } from '@/shared/lib/formatters';

export type VideoTrack = 'Ritual' | 'Curtos' | 'Respirar';

export type AppVideo = {
  id: string;
  title: string;
  channel: string;
  duration: string;
  label: string;
  publishedLabel: string;
  summary: string;
  thumbnailColor: string;
  track: VideoTrack;
  watched: boolean;
  removed: boolean;
  inToday: boolean;
};

export type AppChannel = {
  id: string;
  name: string;
  subscriberCount: string;
  cadence: string;
  note: string;
  accent: string;
  active: boolean;
};

export type AppCollection = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  countLabel: string;
  accent: string;
};

type DemoStoreValue = {
  channels: AppChannel[];
  collections: AppCollection[];
  goalMinutes: number;
  lastIncreasedDate: string | null;
  lastSyncLabel: string;
  removedVideos: AppVideo[];
  todayVideos: AppVideo[];
  user: {
    displayName: string;
    email: string;
  };
  videos: AppVideo[];
  watchedMinutes: number;
  markWatched: (id: string) => void;
  noteGoalIncrease: (date: string) => void;
  removeVideo: (id: string) => void;
  restoreVideo: (id: string) => void;
  setGoalMinutes: (minutes: number) => void;
  syncSubscriptions: () => void;
  toggleChannel: (id: string, active: boolean) => void;
};

const initialVideos: AppVideo[] = [
  {
    id: 'ritual-design',
    title: 'Como construir um ritual de foco que não depende de disciplina heroica',
    channel: 'Ninho de Produto',
    duration: '18:42',
    label: 'Comece por aqui',
    publishedLabel: 'Hoje, 07:40',
    summary: 'Uma conversa longa, calma e útil para abrir a manhã sem cair em backlog infinito.',
    thumbnailColor: '#824D3E',
    track: 'Ritual',
    watched: false,
    removed: false,
    inToday: true,
  },
  {
    id: 'short-breathe',
    title: 'Três respirações para sair do automático antes de apertar play',
    channel: 'Mente em Movimento',
    duration: '06:10',
    label: 'Curto',
    publishedLabel: 'Hoje, 08:15',
    summary: 'Conteúdo leve para encaixar entre tarefas sem sequestrar a sua atenção.',
    thumbnailColor: '#355C7D',
    track: 'Respirar',
    watched: false,
    removed: false,
    inToday: true,
  },
  {
    id: 'short-systems',
    title: 'Sistemas suaves: por que reduzir entradas melhora a sua clareza',
    channel: 'Ateliê Digital',
    duration: '09:58',
    label: 'Seleção do dia',
    publishedLabel: 'Ontem',
    summary: 'Um recorte objetivo com exemplos práticos para deixar a fila mais intencional.',
    thumbnailColor: '#284B63',
    track: 'Curtos',
    watched: false,
    removed: false,
    inToday: true,
  },
  {
    id: 'essay-slow-tech',
    title: 'Tecnologia lenta na prática: escolhendo melhor o que merece seu tempo',
    channel: 'Casa Editorial',
    duration: '24:15',
    label: 'Aprofundar',
    publishedLabel: 'Ontem',
    summary: 'Ensaio mais denso para quando você quiser trocar volume por contexto.',
    thumbnailColor: '#5C3D2E',
    track: 'Ritual',
    watched: false,
    removed: false,
    inToday: true,
  },
  {
    id: 'archive-finished',
    title: 'Micro hábitos de atenção para fechar o dia sem ruído',
    channel: 'Pausa Técnica',
    duration: '12:32',
    label: 'Assistido',
    publishedLabel: 'Ontem',
    summary: 'Já passou pela sua rotina e fica aqui como referência de tom e ritmo.',
    thumbnailColor: '#5B8E7D',
    track: 'Respirar',
    watched: true,
    removed: false,
    inToday: false,
  },
  {
    id: 'archive-removed',
    title: 'Noticiário urgente demais para um app que quer te deixar em paz',
    channel: 'Flash Diário',
    duration: '14:04',
    label: 'Ocultado',
    publishedLabel: '2 dias atrás',
    summary: 'Exemplo de vídeo removido da fila por destoar do clima que o produto quer construir.',
    thumbnailColor: '#4B5563',
    track: 'Curtos',
    watched: false,
    removed: true,
    inToday: false,
  },
];

const initialChannels: AppChannel[] = [
  {
    id: 'ninho',
    name: 'Ninho de Produto',
    subscriberCount: '182 mil',
    cadence: 'Semanal',
    note: 'Ensaios mais profundos sobre sistemas, rotina e design de atenção.',
    accent: '#824D3E',
    active: true,
  },
  {
    id: 'mente',
    name: 'Mente em Movimento',
    subscriberCount: '74 mil',
    cadence: 'Diário',
    note: 'Vídeos curtos para transição entre contextos e pequenas pausas.',
    accent: '#355C7D',
    active: true,
  },
  {
    id: 'atelie',
    name: 'Ateliê Digital',
    subscriberCount: '96 mil',
    cadence: '2x por semana',
    note: 'Conteúdo visualmente forte, com boa taxa de aproveitamento para a sua biblioteca.',
    accent: '#284B63',
    active: true,
  },
  {
    id: 'casa',
    name: 'Casa Editorial',
    subscriberCount: '221 mil',
    cadence: 'Semanal',
    note: 'Vídeos mais longos, bons para sessões focadas e finais de semana.',
    accent: '#5C3D2E',
    active: false,
  },
  {
    id: 'pausa',
    name: 'Pausa Técnica',
    subscriberCount: '41 mil',
    cadence: 'Quinzenal',
    note: 'Canal pequeno e consistente, com um tom próximo do handoff original.',
    accent: '#5B8E7D',
    active: true,
  },
];

const collections: AppCollection[] = [
  {
    id: 'manha',
    title: 'Manhã sem avalanche',
    eyebrow: 'Coleção editorial',
    description: 'Uma fila curta para abrir o dia com menos urgência e mais direção.',
    countLabel: '5 vídeos leves',
    accent: '#824D3E',
  },
  {
    id: 'intervalo',
    title: 'Intervalos que limpam a cabeça',
    eyebrow: 'Respirar',
    description: 'Conteúdos curtos para trocar de contexto sem cair em doomscroll.',
    countLabel: '8 pausas possíveis',
    accent: '#355C7D',
  },
  {
    id: 'estudo',
    title: 'Sessão longa de aprofundamento',
    eyebrow: 'Foco total',
    description: 'Quando você realmente quer sentar, assistir e sair com uma ideia melhor formada.',
    countLabel: '3 ensaios selecionados',
    accent: '#5C3D2E',
  },
];

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

export function DemoStoreProvider({ children }: PropsWithChildren) {
  const [videos, setVideos] = useState(initialVideos);
  const [channels, setChannels] = useState(initialChannels);
  const [goalMinutes, setGoalMinutes] = useState(120);
  const [lastIncreasedDate, setLastIncreasedDate] = useState<string | null>(null);
  const [lastSyncLabel, setLastSyncLabel] = useState('há 18 min');

  const todayVideos = videos.filter((video) => video.inToday && !video.removed && !video.watched);
  const removedVideos = videos.filter((video) => video.removed);
  const watchedMinutes = videos
    .filter((video) => video.watched)
    .reduce((sum, video) => sum + parseDurationToMinutes(video.duration), 0);

  const markWatched = (id: string) => {
    setVideos((currentVideos) =>
      currentVideos.map((video) =>
        video.id === id
          ? {
              ...video,
              watched: true,
              inToday: false,
              removed: false,
            }
          : video
      )
    );
  };

  const removeVideo = (id: string) => {
    setVideos((currentVideos) =>
      currentVideos.map((video) =>
        video.id === id
          ? {
              ...video,
              removed: true,
              inToday: false,
            }
          : video
      )
    );
  };

  const restoreVideo = (id: string) => {
    setVideos((currentVideos) =>
      currentVideos.map((video) =>
        video.id === id
          ? {
              ...video,
              removed: false,
              inToday: false,
            }
          : video
      )
    );
  };

  const toggleChannel = (id: string, active: boolean) => {
    setChannels((currentChannels) =>
      currentChannels.map((channel) =>
        channel.id === id
          ? {
              ...channel,
              active,
            }
          : channel
      )
    );
  };

  return (
    <DemoStoreContext.Provider
      value={{
        channels,
        collections,
        goalMinutes,
        lastIncreasedDate,
        lastSyncLabel,
        removedVideos,
        todayVideos,
        user: {
          displayName: 'Lucas Borges',
          email: 'lucas@playcalmo.app',
        },
        videos,
        watchedMinutes,
        markWatched,
        noteGoalIncrease: setLastIncreasedDate,
        removeVideo,
        restoreVideo,
        setGoalMinutes,
        syncSubscriptions: () => setLastSyncLabel('agora mesmo'),
        toggleChannel,
      }}
    >
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore() {
  const context = useContext(DemoStoreContext);

  if (!context) {
    throw new Error('useDemoStore must be used within DemoStoreProvider');
  }

  return context;
}
