import { NotFoundError, ForbiddenError } from "../types/app-error";
import { collectionRepository } from "../repository/collection.repository";
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "../validator/collection-validator";

async function getOwned(collectionId: string, userId: string) {
  const collection = await collectionRepository.findById(collectionId);
  if (!collection) throw new NotFoundError("Collection not found");
  if (collection.userId !== userId) throw new ForbiddenError();
  return collection;
}

export const collectionService = {
  create(userId: string, input: CreateCollectionInput) {
    return collectionRepository.create(userId, input);
  },

  list(userId: string) {
    return collectionRepository.findAllByUser(userId);
  },

  async getById(collectionId: string, userId: string) {
    return getOwned(collectionId, userId);
  },

  async update(collectionId: string, userId: string, input: UpdateCollectionInput) {
    await getOwned(collectionId, userId);
    return collectionRepository.update(collectionId, input);
  },

  async remove(collectionId: string, userId: string) {
    await getOwned(collectionId, userId);
    return collectionRepository.delete(collectionId);
  },

  async addSource(collectionId: string, sourceId: string, userId: string) {
    await getOwned(collectionId, userId);
    return collectionRepository.addSource(collectionId, sourceId);
  },

  async removeSource(collectionId: string, sourceId: string, userId: string) {
    await getOwned(collectionId, userId);
    return collectionRepository.removeSource(collectionId, sourceId);
  },
};
