import LZString from 'lz-string';

type StorageValidator<T> = (value: string | null) => T | null;
type StorageSerializer<T> = (value: T) => string;
type StorageDeserializer<T> = (value: string) => T;
type StorageMigrator<T> = (value: string | null) => T | null;

interface StorageManagerOptions<T> {
  key: string;
  defaultValue: T;
  validator?: StorageValidator<T>;
  serializer?: StorageSerializer<T>;
  deserializer?: StorageDeserializer<T>;
  migrator?: StorageMigrator<T>;
}

interface StorageManager<T> {
  get: () => T;
  set: (value: T) => void;
  clear: () => void;
  has: () => boolean;
}

export function createStorageManager<T>({
  key,
  defaultValue,
  validator,
  serializer = String,
  deserializer = (v) => v as unknown as T,
  migrator,
}: StorageManagerOptions<T>): StorageManager<T> {
  const get = (): T => {
    try {
      const stored = localStorage.getItem(key);
      
      // Apply migration if provided
      const migrated = migrator ? migrator(stored) : stored;
      const valueToValidate = migrated !== undefined ? migrated : stored;
      
      // Apply validation if provided
      if (validator) {
        const validated = validator(valueToValidate as string | null);
        if (validated !== null) return validated;
      } else if (valueToValidate !== null) {
        return deserializer(valueToValidate as string);
      }
      
      return defaultValue;
    } catch (error) {
      console.error(`Failed to retrieve ${key} from local storage:`, error);
      return defaultValue;
    }
  };

  const set = (value: T): void => {
    try {
      localStorage.setItem(key, serializer(value));
    } catch (error) {
      console.error(`Failed to save ${key} to local storage:`, error);
    }
  };

  const clear = (): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to clear ${key} from local storage:`, error);
    }
  };

  const has = (): boolean => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  };

  return { get, set, clear, has };
}

// Specialized helper for compressed data (CSV storage)
export function createCompressedStorageManager(key: string): StorageManager<string | null> {
  return {
    get: (): string | null => {
      try {
        const data = localStorage.getItem(key);
        if (data === null) return null;
        const decompressed = LZString.decompressFromUTF16(data);
        return decompressed !== null ? decompressed : data;
      } catch (error) {
        console.error(`Failed to retrieve ${key} from local storage:`, error);
        return null;
      }
    },
    set: (value: string): void => {
      try {
        const compressed = LZString.compressToUTF16(value);
        localStorage.setItem(key, compressed);
      } catch (error) {
        console.error(`Failed to save ${key} to local storage:`, error);
      }
    },
    clear: (): void => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to clear ${key} from local storage:`, error);
      }
    },
    has: (): boolean => {
      try {
        return localStorage.getItem(key) !== null;
      } catch {
        return false;
      }
    },
  };
}
