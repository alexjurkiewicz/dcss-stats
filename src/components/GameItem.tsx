import clsx from 'clsx';
import Link from 'next/link';
import { first } from 'lodash-es';
import { forwardRef } from 'react';
import { addS, date, formatNumber, getPlayerPageHref } from '@utils';
import { Game } from '@types';
import externalLinkSvg from '@external.svg';

type Props = {
  game: Game;
  includePlayer?: boolean;
  shadow?: boolean;
};

export const GameItem = forwardRef<HTMLDivElement, Props>(
  ({ game, includePlayer, shadow }, ref) => {
    const duration = date.duration(game.duration, 'seconds');

    return (
      <div
        ref={ref}
        className={clsx(
          'py-1 px-2 border rounded border-gray-200 text-sm bg-white text-black',
          game.isWin && 'border-l-emerald-500 border-l-2',
          shadow && 'shadow-md',
        )}
      >
        <div className="font-medium">
          <MorgueLink game={game} />
          {includePlayer && (
            <div>
              <Link href={getPlayerPageHref(game.name)}>
                <a className="font-medium">{game.name}</a>
              </Link>
            </div>
          )}
          {game.race} {game.class} <span className="font-light">the {game.title}</span>
        </div>

        <div>
          XL:{game.xl},{' '}
          <span className={clsx(game.isWin ? 'text-emerald-500' : 'text-red-500')}>
            {game.endMessage}
          </span>{' '}
          {!game.isWin && game.lvl > 0 && (
            <span>
              in {game.branch}:{game.lvl}{' '}
            </span>
          )}
          {game.uniqueRunes > 0 && (
            <span className="text-indigo-600">
              {game.isWin ? 'and' : 'with'} {game.uniqueRunes} {addS('rune', game.uniqueRunes)}!
            </span>
          )}
        </div>
        <div>
          {game.god ? (
            <>
              <span className="font-light">Was {getPietyLevel(game.piety, game.god)} of</span>{' '}
              {game.god}
            </>
          ) : (
            'Was an Atheist'
          )}
        </div>
        <div className="">
          <span className="text-red-800">str:{game.str}</span>{' '}
          <span className="text-blue-800">int:{game.int}</span>{' '}
          <span className="text-green-800">dex:{game.dex}</span>{' '}
          {game.ac != null && <span className="text-yellow-800">ac:{game.ac}</span>}{' '}
          {game.ev != null && <span className="text-violet-800">ev:{game.ev}</span>}{' '}
          {game.sh != null && <span className="text-sky-800">sh:{game.sh}</span>}
        </div>
        <div className="pt-0.5 text-gray-400 text-xs flex justify-between gap-2">
          <div>
            {formatNumber(game.score)} score points, {formatNumber(game.turns)} turns, lasted for{' '}
            {duration.format('D') !== '0' && (
              <>
                <span>{duration.format('D')} day</span> and{' '}
              </>
            )}
            {duration.format('HH:mm:ss')}
          </div>
          <ServerLink game={game} />
        </div>
        <div className="flex pt-0.5 justify-between text-gray-400 text-xs gap-2">
          <TimeAndVersion game={game} />
        </div>
      </div>
    );
  },
);

export const CompactGameItem = forwardRef<HTMLDivElement, Props>(({ game }, ref) => {
  const duration = date.duration(game.duration, 'seconds');

  return (
    <div ref={ref} className="py-0.5">
      <div className="text-sm">
        <MorgueLink game={game} />
        {game.char}
        {game.god && <span className="font-light"> of {game.god}</span>},{' '}
        <span className={clsx(game.isWin ? 'text-emerald-500' : 'text-red-500')}>
          {game.isWin ? 'escaped' : game.endMessage}
        </span>{' '}
        {!game.isWin && game.lvl > 0 && (
          <span>
            in {game.branch}:{game.lvl}{' '}
          </span>
        )}
        {game.uniqueRunes > 0 && (
          <span className="text-indigo-600">
            with {game.uniqueRunes} {addS('rune', game.uniqueRunes)}!
          </span>
        )}
      </div>
      <div className="flex justify-between gap-2 text-gray-400 text-xs">
        XL:{game.xl}; score {formatNumber(game.score)}; turns {formatNumber(game.turns)}; lasted for{' '}
        {duration.format('D') !== '0' && (
          <>
            <span>{duration.format('D')} day</span> and{' '}
          </>
        )}
        {duration.format('HH:mm:ss')}
        <ServerLink game={game} />
      </div>
      <div className="flex justify-between text-gray-400 text-xs gap-2">
        <TimeAndVersion compact game={game} />
      </div>
    </div>
  );
});

const format = 'DD MMM YYYY [at] HH:mm:ss';
const TimeAndVersion = ({ compact, game }: { compact?: boolean; game: Game }) => {
  if (!game.server) {
    return null;
  }

  const start = date(game.startAt).format(format);
  const end = date(game.endAt).format(format);

  return (
    <>
      <div title={`Start: ${start}\nEnd: ${end}`}>
        {!compact && <>{date(game.endAt).fromNow()}, </>} {end}
      </div>
      <div>v{game.version}</div>
    </>
  );
};

const ServerLink = ({ game }: { game: Game }) => {
  if (!game.server) {
    return null;
  }

  return (
    <a
      target="_blank"
      href={game.server.url}
      title={`Server: ${game.server.name}\n${game.server.url}`}
      rel="noopener noreferrer"
      className="underline"
    >
      {game.server.abbreviation}
    </a>
  );
};

const MorgueLink = ({ game }: { game: Game }) => {
  if (!game.server) {
    return null;
  }

  return (
    <a
      className="float-right w-5 h-5 bg-no-repeat bg-center"
      target="_blank"
      href={`${game.server.morgueUrl}/${game.name}/${getMorgueFileName(game)}`}
      rel="noopener noreferrer"
      title="Morgue"
      style={{
        backgroundImage: `url(${externalLinkSvg.src})`,
      }}
    />
  );
};

const getMorgueFileName = (game: Game) => {
  return `morgue-${game.name}-${date(game.endAt).utc().format('YYYYMMDD-HHmmss')}.txt`;
};

const breakpoints = [30, 50, 75, 100, 120, 160];
const ranks = ['an Initiate', 'a Follower', 'a Believer', 'a Priest', 'an Elder', 'a High Priest'];
const xomBreakpoints = [20, 50, 80, 120, 150, 180];
const xomRanks = [
  'a very special plaything',
  'a special plaything',
  'a plaything',
  'a toy',
  'a favourite toy',
  'a beloved toy',
];

const getPietyLevel = (piety: number | null, god?: string) => {
  if (god === 'Gozag') {
    return 'a Client';
  }

  if (god === 'Xom') {
    return getPietyLevelGeneric(piety, xomRanks, xomBreakpoints, 'a teddy bear');
  }

  return getPietyLevelGeneric(piety, ranks, breakpoints, 'the Champion');
};

const getPietyLevelGeneric = (
  piety: number | null,
  ranks: string[],
  breakpoints: number[],
  lastRank: string,
) => {
  if (!piety) {
    return first(ranks);
  }

  for (let i = 0; i < breakpoints.length; i++) {
    if (piety < breakpoints[i]) {
      return ranks[i];
    }
  }

  return lastRank;
};
