import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  api,
  type DoctorInput,
  type DoctorPatch,
  type PatientInput,
  type PatientPatch,
  type TaskInput,
  type TaskPatch,
  type DietPayload,
} from "./api";

export const adminKeys = {
  stats: ["admin", "stats"] as const,
  doctors: ["admin", "doctors"] as const,
  patients: ["admin", "patients"] as const,
  alerts: ["admin", "alerts"] as const,
};
export const doctorKeys = {
  plan: ["doctor", "plan"] as const,
  diets: ["doctor", "diets"] as const,
};
export const patientKeys = { home: ["patient", "home"] as const };

/** Boshqa qurilmada ham yangi bo'lishi uchun qisqa polling. */
const REFRESH_MS = 60_000;

export function useAdminStats() {
  return useQuery({ queryKey: adminKeys.stats, queryFn: api.stats, refetchInterval: REFRESH_MS });
}
export function useAdminDoctors() {
  return useQuery({
    queryKey: adminKeys.doctors,
    queryFn: api.doctors,
    refetchInterval: REFRESH_MS,
  });
}
export function useAdminPatients() {
  return useQuery({
    queryKey: adminKeys.patients,
    queryFn: api.allPatients,
    refetchInterval: REFRESH_MS,
  });
}
export function useAdminAlerts() {
  return useQuery({
    queryKey: adminKeys.alerts,
    queryFn: api.adminAlerts,
    refetchInterval: REFRESH_MS,
  });
}

export function useDoctorPlan() {
  return useQuery({
    queryKey: doctorKeys.plan,
    queryFn: api.myPatients,
    refetchInterval: REFRESH_MS,
  });
}
export function useDoctorDiets() {
  return useQuery({ queryKey: doctorKeys.diets, queryFn: api.diets, refetchInterval: REFRESH_MS });
}

export function usePatientHome() {
  return useQuery({ queryKey: patientKeys.home, queryFn: api.home, refetchInterval: REFRESH_MS });
}

function useInvalidating<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  keys: readonly QueryKey[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(keys.map((key) => qc.invalidateQueries({ queryKey: key })));
    },
  });
}

const ALL_ADMIN = [adminKeys.stats, adminKeys.doctors, adminKeys.patients, adminKeys.alerts];
const ALL_DOCTOR = [doctorKeys.plan, doctorKeys.diets];

export const useCreateDoctor = () =>
  useInvalidating((input: DoctorInput) => api.createDoctor(input), ALL_ADMIN);
export const usePatchDoctor = () =>
  useInvalidating((input: { id: string } & DoctorPatch) => {
    const { id, ...patch } = input;
    return api.patchDoctor(id, patch);
  }, ALL_ADMIN);
export const useDeleteDoctor = () =>
  useInvalidating((id: string) => api.deleteDoctor(id), ALL_ADMIN);
export const useDeletePatientByAdmin = () =>
  useInvalidating((id: string) => api.deletePatient(id), ALL_ADMIN);

export const useCreatePatient = () =>
  useInvalidating((input: PatientInput) => api.createPatient(input), ALL_DOCTOR);
export const usePatchPatient = () =>
  useInvalidating(
    (input: { id: string } & PatientPatch) => {
      const { id, ...patch } = input;
      return api.patchPatient(id, patch);
    },
    [doctorKeys.plan, patientKeys.home],
  );
export const useDeletePatient = () =>
  useInvalidating((id: string) => api.deletePatient(id), ALL_DOCTOR);

export const useCreateTask = () =>
  useInvalidating(
    (input: { patientId: string } & TaskInput) => {
      const { patientId, ...task } = input;
      return api.createTask(patientId, task);
    },
    [doctorKeys.plan],
  );
export const usePatchTask = () =>
  useInvalidating(
    (input: { id: string } & TaskPatch) => {
      const { id, ...patch } = input;
      return api.patchTask(id, patch);
    },
    [doctorKeys.plan, patientKeys.home],
  );
export const useDeleteTask = () =>
  useInvalidating((id: string) => api.deleteTask(id), [doctorKeys.plan]);

export const useCreateDiet = () =>
  useInvalidating(
    (input: { number: number; payload: DietPayload }) => api.createDiet(input),
    [doctorKeys.diets, doctorKeys.plan],
  );
export const usePatchDiet = () =>
  useInvalidating(
    (input: { id: string; number?: number; payload?: DietPayload }) => {
      const { id, ...patch } = input;
      return api.patchDiet(id, patch);
    },
    [doctorKeys.diets, doctorKeys.plan, patientKeys.home],
  );
export const useDeleteDiet = () =>
  useInvalidating((id: string) => api.deleteDiet(id), [doctorKeys.diets, doctorKeys.plan]);

export const useToggleTask = () =>
  useInvalidating((taskId: string) => api.toggle(taskId), [patientKeys.home]);

export function usePushRegistration() {
  return useMutation({
    mutationFn: (input: { endpoint: string; subscribe: boolean }) =>
      input.subscribe ? api.subscribe(input.endpoint) : api.unsubscribe(input.endpoint),
  });
}
