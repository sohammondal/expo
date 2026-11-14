import { inMemoryContext } from 'expo-router/internal/testing';

import { getTypedRoutesDeclarationFile } from '../generate';
import { formatDiagnostics, getTypeErrors, ts } from './tsHarness';

const routes = getTypedRoutesDeclarationFile(
  inMemoryContext({
    '(tabs)/search': () => null,
    'product/[id]': () => null,
    checkout: () => null,
    settings: () => null,
  }),
  {
    testIgnoreComments: true,
    getSearchParamsImportPath: (contextKey) =>
      ({
        './(tabs)/search.js': './app/(tabs)/search',
        './product/[id].js': './app/product/[id]',
        './checkout.js': './app/checkout',
      })[contextKey],
  }
);

const searchRoute = ts`
  export type SearchParams = { q?: string; sort?: 'relevance' | 'price'; tags?: string[] };
`;

const productRoute = ts`
  export type SearchParams = { ref?: 'home' | 'share' };
`;

const checkoutRoute = ts`
  export type SearchParams = { cartId: string; coupon?: string };
`;

const assertions = ts`
  import { expectTypeOf } from 'expect-type';
  import type { UnknownOutputParams } from './routes';
  import { useRouter, useLocalSearchParams } from './routes';

  const router = useRouter();

  // Routes that export SearchParams
  router.push({ pathname: '/search', params: { q: 'shoes', sort: 'price', tags: ['red'] } });
  router.push({ pathname: '/(tabs)/search', params: { q: 1 } });
  router.push({ pathname: '/search' });
  router.push({ pathname: '/product/[id]', params: { id: 1, ref: 'share' } });
  router.push({ pathname: '/checkout', params: { cartId: 'c1' } });
  // @ts-expect-error 'qury' is not a declared search param
  router.push({ pathname: '/search', params: { qury: 'shoes' } });
  // @ts-expect-error 'cheapest' is not a declared sort value
  router.push({ pathname: '/search', params: { sort: 'cheapest' } });
  // @ts-expect-error tags must be an array
  router.push({ pathname: '/search', params: { tags: 'red' } });
  // @ts-expect-error the 'id' param is missing
  router.push({ pathname: '/product/[id]', params: { ref: 'share' } });
  // @ts-expect-error params are required when a search param is required
  router.push({ pathname: '/checkout' });
  // @ts-expect-error the 'cartId' search param is missing
  router.push({ pathname: '/checkout', params: { coupon: 'SAVE' } });

  expectTypeOf(useLocalSearchParams<'/search'>()).toEqualTypeOf<{
    q?: string;
    sort?: 'relevance' | 'price';
    tags?: string[];
  }>();
  expectTypeOf(useLocalSearchParams<'/product/[id]'>()).toEqualTypeOf<
    { ref?: 'home' | 'share' } & { id: string }
  >();

  router.setParams<'/checkout'>({ coupon: 'SAVE' });
  // @ts-expect-error 'qury' is not a declared search param
  router.setParams<'/search'>({ qury: 'shoes' });

  // Routes without SearchParams
  router.push({ pathname: '/settings', params: { anything: 'goes' } });
  expectTypeOf(useLocalSearchParams<'/settings'>()).toEqualTypeOf<UnknownOutputParams>();
`;

it('checks search params against the SearchParams type of the route', () => {
  const diagnostics = getTypeErrors({
    'routes.ts': routes,
    'app/(tabs)/search.tsx': searchRoute,
    'app/product/[id].tsx': productRoute,
    'app/checkout.tsx': checkoutRoute,
    'index.ts': assertions,
  });
  expect(formatDiagnostics(diagnostics)).toBe('');
});
