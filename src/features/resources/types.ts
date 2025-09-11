export interface Resource {
  id: number;
  name: string;
  type: 'API' | 'PAGE' | 'COMPONENT';
  status: 'ACTIVE' | 'INACTIVE';
  applicationId: number;
  items: ResourceItem[];
  externalId?: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export interface ResourceItem {
  id: number;
  name: string;
  description?: string;
  permissionId: number;
  resourceId: number;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export interface CreateResourceDto {
  name: string;
  type: 'API' | 'PAGE' | 'COMPONENT';
  status?: 'ACTIVE' | 'INACTIVE';
  applicationId: number;
  items?: Omit<
    ResourceItem,
    'id' | 'resourceId' | 'createdBy' | 'createdDate' | 'lastModifiedBy' | 'lastModifiedDate'
  >[];
  externalId?: string;
}

export interface UpdateResourceDto {
  name?: string;
  type?: 'API' | 'PAGE' | 'COMPONENT';
  status?: 'ACTIVE' | 'INACTIVE';
  items?: Omit<
    ResourceItem,
    'id' | 'resourceId' | 'createdBy' | 'createdDate' | 'lastModifiedBy' | 'lastModifiedDate'
  >[];
  externalId?: string;
}
