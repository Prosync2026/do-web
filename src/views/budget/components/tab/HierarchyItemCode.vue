<template>
    <div>
        <BaseTreeTable :treeData="treeNodes" :columns="columns" :pagination="pagination" @page-change="fetchTree" @refresh="refreshTree" />
    </div>
</template>

<script src="./HierarchyItemCode.script.ts"></script>
