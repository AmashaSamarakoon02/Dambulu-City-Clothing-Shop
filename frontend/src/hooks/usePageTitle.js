import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | Luxe Attire` : 'Luxe Attire | Clothing Store';
  }, [title]);
};

export default usePageTitle;
