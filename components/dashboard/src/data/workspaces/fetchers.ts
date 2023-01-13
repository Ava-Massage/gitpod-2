/**
 * Copyright (c) 2023 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License.AGPL.txt in the project root for license information.
 */

import { GitpodServer, WorkspaceInfo } from "@gitpod/gitpod-protocol";
import { useCallback } from "react";
import { useFeatureFlags } from "../../contexts/FeatureFlagContext";
import { workspacesService } from "../../service/public-api";
import { getGitpodService } from "../../service/service";

type UseFetchWorkspacesArgs = {
    limit: number;
};

export type FetchWorkspacesReturnValue = WorkspaceInfo[];

export const useFetchWorkspaces = ({ limit = 50 }: UseFetchWorkspacesArgs) => {
    return useCallback(async (): Promise<FetchWorkspacesReturnValue> => {
        // TODO: Can we update the backend api to sort & rank pinned over non-pinned for us?
        const [infos, pinned] = await Promise.all([
            getGitpodService().server.getWorkspaces({
                limit,
                includeWithoutProject: true,
            }),
            // Additional fetch for pinned workspaces
            // see also: https://github.com/gitpod-io/gitpod/issues/4488
            getGitpodService().server.getWorkspaces({
                limit,
                pinnedOnly: true,
                includeWithoutProject: true,
            }),
        ]);

        // Merge both data sets into one unique (by ws id) array
        const workspacesMap = new Map(infos.map((ws) => [ws.workspace.id, ws]));
        const pinnedWorkspacesMap = new Map(pinned.map((ws) => [ws.workspace.id, ws]));
        const workspaces = Array.from(new Map([...workspacesMap, ...pinnedWorkspacesMap]).values());

        return workspaces;
    }, [limit]);
};

type FetchUpdateWorkspaceDescriptionArgs = {
    workspaceId: string;
    newDescription: string;
};
export const useFetchUpdateWorkspaceDescription = () => {
    return useCallback(async ({ workspaceId, newDescription }: FetchUpdateWorkspaceDescriptionArgs) => {
        return await getGitpodService().server.setWorkspaceDescription(workspaceId, newDescription);
    }, []);
};

type DeleteWorkspaceFetcherArgs = {
    workspaceId: string;
};
export const useDeleteWorkspaceFetcher = () => {
    const { usePublicApiWorkspacesService } = useFeatureFlags();

    return useCallback(
        async ({ workspaceId }: DeleteWorkspaceFetcherArgs) => {
            return usePublicApiWorkspacesService
                ? await workspacesService.deleteWorkspace({ workspaceId })
                : await getGitpodService().server.deleteWorkspace(workspaceId);
        },
        [usePublicApiWorkspacesService],
    );
};

type StopWorkspaceFetcherArgs = {
    workspaceId: string;
};
export const useStopWorkspaceFetcher = () => {
    const { usePublicApiWorkspacesService } = useFeatureFlags();

    return useCallback(
        async ({ workspaceId }: StopWorkspaceFetcherArgs) => {
            return usePublicApiWorkspacesService
                ? workspacesService.stopWorkspace({ workspaceId })
                : getGitpodService().server.stopWorkspace(workspaceId);
        },
        [usePublicApiWorkspacesService],
    );
};

type ToggleWorkspaceSharedFetcherArgs = {
    workspaceId: string;
    level: GitpodServer.AdmissionLevel;
};
export const useToggleWorkspaceSharedFetcher = () => {
    return useCallback(async ({ workspaceId, level }: ToggleWorkspaceSharedFetcherArgs) => {
        return await getGitpodService().server.controlAdmission(workspaceId, level);
    }, []);
};

type ToggleWorkspacePinnedFetcherArgs = {
    workspaceId: string;
};
export const useToggleWorkspacePinnedFetcher = () => {
    return useCallback(async ({ workspaceId }: ToggleWorkspacePinnedFetcherArgs) => {
        return await getGitpodService().server.updateWorkspaceUserPin(workspaceId, "toggle");
    }, []);
};
