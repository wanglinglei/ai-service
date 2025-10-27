import type {
  ServiceDefinition,
  FeatureServiceConfig,
  ConfigServiceNameConfig,
  ServiceNameConfig,
} from './types';

export class ServiceRegistry {
  private services: Map<string, ServiceDefinition> = new Map();
  private featureServiceMap: FeatureServiceConfig = {};

  // 注册服务
  registerService<TParams, TResponse>(
    serviceDefinition: ServiceDefinition<TParams, TResponse>,
  ): void {
    this.services.set(serviceDefinition.name, serviceDefinition as ServiceDefinition);
  }

  registerServices(services: ServiceDefinition[]): void {
    services.forEach((service) => {
      this.registerService(service);
    });
  }

  // 配置功能-服务映射
  configureFeatureServices(featureConfig: ConfigServiceNameConfig): void {
    let newFeatureServiceMap: FeatureServiceConfig = {};
    Object.keys(featureConfig).forEach((feature) => {
      featureConfig[feature]?.forEach((service) => {
        newFeatureServiceMap[feature] = [...(newFeatureServiceMap[feature] || []), service.value];
      });
    });
    this.featureServiceMap = { ...this.featureServiceMap, ...newFeatureServiceMap };
  }

  // 获取服务实例
  getService<TParams, TResponse>(
    serviceName: string,
  ): ServiceDefinition<TParams, TResponse> | undefined {
    return this.services.get(serviceName) as ServiceDefinition<TParams, TResponse>;
  }

  // 检查服务是否存在
  hasService(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  // 获取所有注册的服务
  getAllServices(): string[] {
    return Array.from(this.services.keys());
  }

  // 根据功能获取对应的服务列表
  getServicesByFeature(feature: string): string[] {
    return this.featureServiceMap[feature] || [];
  }

  // 获取所有功能-服务映射
  getFeatureServiceMap(): FeatureServiceConfig {
    return { ...this.featureServiceMap };
  }
}
