'use client';

import { useI18n } from 'fumadocs-ui/contexts/i18n';
import { 
  SearchDialog, 
  SearchDialogClose, 
  SearchDialogContent, 
  SearchDialogFooter, 
  SearchDialogHeader, 
  SearchDialogIcon, 
  SearchDialogInput, 
  SearchDialogList, 
  SearchDialogOverlay, 
  TagsList, 
  TagsListItem, 
  type SharedProps 
} from 'fumadocs-ui/components/dialog/search';
import { useMemo, useState } from 'react';
import { useOnChange } from 'fumadocs-core/utils/use-on-change';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { oramaStaticClient } from 'fumadocs-core/search/client/orama-static';

export default function CustomSearchDialog({ 
  defaultTag, 
  tags = [], 
  allowClear = false, 
  links = [], 
  footer, 
  ...props 
}: SharedProps & { 
  defaultTag?: string; 
  tags?: { name: string; value: string }[]; 
  allowClear?: boolean; 
  links?: [string, string][]; 
  footer?: React.ReactNode; 
}) {
  const { locale } = useI18n();
  const [tag, setTag] = useState(defaultTag);
  const { search, setSearch, query } = useDocsSearch({
    client: oramaStaticClient({
      locale,
      tag
    }),
  });

  const defaultItems = useMemo(() => {
    if (links.length === 0) return null;
    return links.map(([name, link]) => ({
      type: 'page' as const,
      id: name,
      content: name,
      url: link
    }));
  }, [links]);

  useOnChange(defaultTag, (v) => {
    setTag(v);
  });

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== 'empty' ? query.data : defaultItems} />
      </SearchDialogContent>
      <SearchDialogFooter>
        {tags.length > 0 && (
          <TagsList tag={tag} onTagChange={setTag} allowClear={allowClear}>
            {tags.map((t) => (
              <TagsListItem key={t.value} value={t.value}>
                {t.name}
              </TagsListItem>
            ))}
          </TagsList>
        )}
        {footer}
      </SearchDialogFooter>
    </SearchDialog>
  );
}
