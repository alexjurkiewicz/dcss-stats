import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useCallback, memo, Fragment, useEffect } from 'react';
import clsx from 'clsx';
import { useCombobox } from 'downshift';
import { GetStaticProps } from 'next';
import { debounce, orderBy, startsWith } from 'lodash-es';
import { api } from '@api';
import { formatNumber, RaceConditionGuard } from '@utils';
import { Player, Server } from '@types';
import refreshSvg from '@refresh.svg';
import { Highlighted } from '@components/Highlighted';
import { createServerApi } from '@api/server';
import { Logo } from '@components/Logo';
import { getFavorites } from '@screens/Player/utils';

const MainPage = (props: Props) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [query, setQuery] = useState('');

  const onLinkClick = useCallback((name: string) => {
    setIsNavigating(true);
    setQuery(name);
  }, []);

  return (
    <div className="container mx-auto px-4 min-h-screen flex flex-col pt-8 md:pt-0 md:justify-center items-center">
      <div className="w-full max-w-lg space-y-4">
        <header className="w-full flex justify-between items-center">
          <Logo />
          <Link href="/suggest">
            <a className="text-right group">
              <span className="text-xs sm:text-base group-hover:underline">
                Get combo suggestion
              </span>{' '}
              <span className="bg-green-400 text-white text-xs rounded px-1 py-0.5">new</span>
            </a>
          </Link>
        </header>
        <Search
          isNavigating={isNavigating}
          setIsNavigating={setIsNavigating}
          query={query}
          setQuery={setQuery}
        />
        <Stats {...props} onLinkClick={onLinkClick} />
      </div>
    </div>
  );
};

const Stats = memo(
  ({ servers, wins, games, top, onLinkClick }: Props & { onLinkClick: (name: string) => void }) => {
    const [favorites, setFavorites] = useState<null | string[]>(null);

    useEffect(() => {
      setFavorites(getFavorites().split(',').filter(Boolean));
    }, []);

    return (
      <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
        <div className="space-y-1">
          <h2 className="font-semibold">Top by games:</h2>
          <ul>
            {top.byGames.map((item) => (
              <li key={item.name} className="flex justify-between">
                <Link prefetch={false} href={getPlayerPageHref(item.name)}>
                  <a
                    className="overflow-ellipsis overflow-hidden whitespace-nowrap hover:underline"
                    onClick={(e) => {
                      if (!e.metaKey) {
                        onLinkClick(item.name);
                      }
                    }}
                  >
                    {item.name}
                  </a>
                </Link>
                <span className="tabular-nums">{formatNumber(item.games)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-1">
          <h2 className="font-semibold">Top by wins:</h2>
          <ul>
            {top.byWins.map((item) => (
              <li key={item.name} className="flex justify-between">
                <Link prefetch={false} href={getPlayerPageHref(item.name)}>
                  <a
                    className="overflow-ellipsis overflow-hidden whitespace-nowrap hover:underline"
                    onClick={(e) => {
                      if (!e.metaKey) {
                        onLinkClick(item.name);
                      }
                    }}
                  >
                    {item.name}
                  </a>
                </Link>
                <span className="tabular-nums">{formatNumber(item.wins)}</span>
              </li>
            ))}
          </ul>
        </div>
        <h2 className="font-semibold flex justify-between">
          Total games: <span>{formatNumber(games)}</span>
        </h2>
        <h2 className="font-semibold flex justify-between">
          Total wins: <span>{formatNumber(wins)}</span>
        </h2>
        <div className="space-y-1">
          <h2 className="font-semibold ">Top by win rate, %:</h2>
          <ul>
            {top.byWinrate.map((item) => (
              <li key={item.name} className="flex justify-between">
                <Link prefetch={false} href={getPlayerPageHref(item.name)}>
                  <a
                    className="overflow-ellipsis overflow-hidden whitespace-nowrap hover:underline"
                    onClick={(e) => {
                      if (!e.metaKey) {
                        onLinkClick(item.name);
                      }
                    }}
                  >
                    {item.name}
                  </a>
                </Link>
                <span className="tabular-nums">
                  {formatNumber(item.winrate * 100, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-1">
          <h2 className="font-semibold ">Your favorites:</h2>
          {favorites && (
            <ul className="max-h-[200px] overflow-y-auto">
              {favorites.length === 0 && <li className="text-gray-400">No one added yet</li>}
              {favorites.map((name) => (
                <li key={name}>
                  <Link prefetch={false} href={getPlayerPageHref(name)}>
                    <a
                      className="overflow-ellipsis overflow-hidden whitespace-nowrap hover:underline"
                      onClick={(e) => {
                        if (!e.metaKey) {
                          onLinkClick(name);
                        }
                      }}
                    >
                      {name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="text-xs text-gray-400 col-span-full">
          Tracked servers:{' '}
          {servers.map((s, index) => (
            <Fragment key={index}>
              {index !== 0 && ', '}
              <a
                key={s.abbreviation}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {s.abbreviation}
              </a>
            </Fragment>
          ))}
          .{' '}
          <Link prefetch={false} href="/servers">
            <a className="hover:underline">more &gt;</a>
          </Link>
        </div>
      </div>
    );
  },
);

type SearchItem = Player;

const Search = ({
  isNavigating,
  setIsNavigating,
  query,
  setQuery,
}: {
  isNavigating: boolean;
  setIsNavigating: (state: boolean) => void;
  query: string;
  setQuery: (state: string) => void;
}) => {
  const [items, setItems] = useState<SearchItem[]>([]);
  const [guard] = useState(() => new RaceConditionGuard());
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const goToPlayerPage = useCallback((slug: string) => {
    setIsNavigating(true);
    router.push(getPlayerPageHref(slug));
  }, []);

  const { isOpen, highlightedIndex, getComboboxProps, getInputProps, getMenuProps, getItemProps } =
    useCombobox({
      id: 'MainSearch',
      items,
      inputValue: query,
      onSelectedItemChange: (e) => {
        if (e.selectedItem) {
          setQuery(e.selectedItem.name);
          goToPlayerPage(e.selectedItem.name);
        }
      },
    });

  const fetchData = useCallback(
    debounce((query: string) => {
      setIsLoading(true);

      guard
        .getGuardedPromise(
          api.get<{ data: Array<SearchItem> }>('/players', {
            params: { query },
          }),
        )
        .then((res) => {
          const target = query.toLowerCase();

          setItems(orderBy(res.data.data, (x) => startsWith(x.name.toLowerCase(), target), 'desc'));
          setIsLoading(false);
        });
    }, 400),
    [],
  );

  return (
    <div {...getComboboxProps({ className: 'relative' })}>
      {isNavigating && (
        <div className="absolute right-2 top-[50%] -translate-y-1/2">
          <div
            className="w-5 h-5 animate-spin"
            style={{ backgroundImage: `url(${refreshSvg.src})` }}
          />
        </div>
      )}

      <input
        autoFocus
        placeholder='Type player name, e.g. "MegaDestroyer3000"'
        className="block border rounded w-full border-gray-400 px-2 h-10"
        value={query}
        {...getInputProps({
          disabled: isNavigating,
          onFocus(e) {
            e.target.select();
          },
          onKeyDown: (e) => {
            if (e.key === 'Enter' && highlightedIndex === -1 && query) {
              (e.nativeEvent as any).preventDownshiftDefault = true;
              goToPlayerPage(query);
            }
          },
          onChange: (e) => {
            const query = e.currentTarget.value.trim();
            setIsLoading(Boolean(query));
            setQuery(query);

            if (query) {
              fetchData(query);
            } else {
              setItems([]);
            }
          },
        })}
      />

      <div
        className={clsx(
          'absolute top-full left-0 z-20 w-full mt-2 overflow-hidden rounded shadow',
          isOpen ? 'block' : 'hidden',
        )}
      >
        <ul {...getMenuProps()} className="max-h-64 bg-white py-2 overflow-y-auto">
          {isOpen && (
            <>
              {isLoading ? (
                <li className="flex justify-center">Loading...</li>
              ) : (
                <>
                  {items.length === 0 && (
                    <li className="flex justify-center">
                      {query ? 'Nothing found' : 'Specify your request'}
                    </li>
                  )}
                  {items.map((item, index) => {
                    const active = items[highlightedIndex] === item;

                    return (
                      <li
                        key={index}
                        className={clsx('px-2', active && 'bg-gray-100')}
                        {...getItemProps({
                          item,
                          index,
                        })}
                      >
                        <Highlighted text={item.name} query={query} />
                      </li>
                    );
                  })}
                </>
              )}
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

type Props = Response;

type Response = {
  games: number;
  wins: number;
  servers: Server[];
  top: {
    byGames: Array<Pick<Player, 'name'> & { games: number }>;
    byWins: Array<Pick<Player, 'name'> & { wins: number }>;
    byWinrate: Array<Pick<Player, 'name'> & { winrate: number }>;
  };
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const res = await createServerApi().api.get<{ data: Response }>('/stats');

  return {
    revalidate: 300,
    props: res.data.data,
  };
};

const getPlayerPageHref = (slug: string) => ({
  pathname: `/players/[slug]`,
  query: {
    slug,
  },
});

export default MainPage;
