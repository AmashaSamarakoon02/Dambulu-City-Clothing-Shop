import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | Dambulla City Clothing Shop` : 'Dambulla City Clothing Shop';
  }, [title]);
};

export default usePageTitle;
