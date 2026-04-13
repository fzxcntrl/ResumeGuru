import { motion } from 'framer-motion';

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      layout
      className="transition-all duration-300 ease-in-out w-full"
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
